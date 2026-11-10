import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestIdFromHeader, logRadinet } from './radinet-logger';

export interface FilterRequest extends Request {
  requestId?: string;
  connection?: { remoteAddress?: string };
}

export interface FilterResponse extends Response {}

@Catch()
export class RadinetGlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FilterRequest>();
    const res = ctx.getResponse<FilterResponse>();

    const rawId = req?.requestId || req?.headers?.['x-request-id'] || req?.headers?.['X-Request-ID'];
    const requestId = getRequestIdFromHeader(rawId);

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttp ? exception.getResponse() : null;
    let message = 'خطای داخلی سرور رخ داد';
    let details: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const respObj = exceptionResponse as Record<string, unknown>;
      if (typeof respObj.message === 'string') {
        message = respObj.message;
      } else if (Array.isArray(respObj.message)) {
        message = respObj.message.join(' | ');
        details = respObj.message;
      } else if (typeof respObj.error === 'string') {
        message = respObj.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errObj = exception as { stack?: string; code?: string; name?: string } | null;
    const clientIp =
      (typeof req?.headers?.['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : null) ||
      req?.ip ||
      req?.connection?.remoteAddress ||
      'unknown';

    const url = req?.originalUrl || req?.url || '/';
    const method = req?.method || 'UNKNOWN';

    logRadinet({
      level: status >= 500 ? 'ERROR' : 'WARN',
      category: 'ERROR',
      message: `HTTP Exception caught: [${status}] ${message}`,
      requestId,
      method,
      url,
      statusCode: status,
      ip: clientIp,
      error: message,
      stack: errObj?.stack,
      details: {
        exceptionName: errObj?.name,
        errorCode: errObj?.code,
        isHttpException: isHttp,
        validationErrors: details,
      },
    });

    try {
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-Backend-Reached', 'true');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      const body = {
        ok: false,
        statusCode: status,
        requestId,
        backendReached: true,
        error: message,
        message: details || message,
        timestamp: new Date().toISOString(),
      };

      if (typeof res.status === 'function' && typeof res.json === 'function') {
        res.status(status).json(body);
      } else {
        res.statusCode = status;
        res.end(JSON.stringify(body));
      }
    } catch (sendErr) {
      logRadinet({
        level: 'ERROR',
        category: 'ERROR',
        message: `Failed to write exception response to client: ${String(sendErr)}`,
        requestId,
      });
    }
  }
}
