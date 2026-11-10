import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getRequestIdFromHeader, logRadinet } from './radinet-logger';

export interface RequestWithMetadata {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  headersReceived?: Record<string, string | string[] | undefined>;
  requestId?: string;
  startTime?: number;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
}

export interface ResponseWithHeader {
  statusCode?: number;
  setHeader?: (name: string, value: string | number | readonly string[]) => unknown;
  getHeader?: (name: string) => unknown;
}

@Injectable()
export class RadinetLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithMetadata>();
    const res = httpCtx.getResponse<ResponseWithHeader>();

    const start = req?.startTime || Date.now();
    const rawReqId =
      req?.requestId ||
      req?.headers?.['x-request-id'] ||
      req?.headers?.['X-Request-ID'];

    const requestId = getRequestIdFromHeader(rawReqId);
    if (req) {
      req.requestId = requestId;
    }

    if (res?.setHeader) {
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-Backend-Reached', 'true');
    }

    const method = req?.method || 'UNKNOWN';
    const url = req?.originalUrl || req?.url || '/';
    const clientIp =
      (typeof req?.headers?.['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : null) ||
      req?.ip ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      'unknown';

    logRadinet({
      level: 'INFO',
      category: 'REQUEST',
      message: 'Incoming HTTP request received by NestJS application',
      requestId,
      method,
      url,
      ip: clientIp,
      details: {
        host: req?.headers?.host,
        userAgent: req?.headers?.['user-agent'],
        contentType: req?.headers?.['content-type'],
        hasAuthHeader: Boolean(req?.headers?.authorization),
        cfRay: req?.headers?.['cf-ray'],
        xRealIp: req?.headers?.['x-real-ip'],
      },
    });

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const statusCode = res?.statusCode || 200;
        const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

        logRadinet({
          level,
          category: 'REQUEST',
          message: `Request completed with status ${statusCode}`,
          requestId,
          method,
          url,
          statusCode,
          durationMs,
          ip: clientIp,
        });
      }),
      catchError((err: unknown) => {
        const durationMs = Date.now() - start;
        const errObj = err as { status?: number; statusCode?: number; message?: string; stack?: string };
        const statusCode = errObj?.status || errObj?.statusCode || 500;
        const level = statusCode >= 500 ? 'ERROR' : 'WARN';

        logRadinet({
          level,
          category: 'REQUEST',
          message: `Request failed with status ${statusCode}: ${errObj?.message || 'Error occurred'}`,
          requestId,
          method,
          url,
          statusCode,
          durationMs,
          ip: clientIp,
          error: errObj?.message || String(err),
          stack: errObj?.stack,
        });

        return throwError(() => err);
      }),
    );
  }
}
