"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadinetGlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const radinet_logger_1 = require("./radinet-logger");
let RadinetGlobalExceptionFilter = class RadinetGlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const rawId = req?.requestId || req?.headers?.['x-request-id'] || req?.headers?.['X-Request-ID'];
        const requestId = (0, radinet_logger_1.getRequestIdFromHeader)(rawId);
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = isHttp ? exception.getResponse() : null;
        let message = 'خطای داخلی سرور رخ داد';
        let details = null;
        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        }
        else if (exceptionResponse && typeof exceptionResponse === 'object') {
            const respObj = exceptionResponse;
            if (typeof respObj.message === 'string') {
                message = respObj.message;
            }
            else if (Array.isArray(respObj.message)) {
                message = respObj.message.join(' | ');
                details = respObj.message;
            }
            else if (typeof respObj.error === 'string') {
                message = respObj.error;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        const errObj = exception;
        const clientIp = (typeof req?.headers?.['x-forwarded-for'] === 'string'
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : null) ||
            req?.ip ||
            req?.connection?.remoteAddress ||
            'unknown';
        const url = req?.originalUrl || req?.url || '/';
        const method = req?.method || 'UNKNOWN';
        (0, radinet_logger_1.logRadinet)({
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
            }
            else {
                res.statusCode = status;
                res.end(JSON.stringify(body));
            }
        }
        catch (sendErr) {
            (0, radinet_logger_1.logRadinet)({
                level: 'ERROR',
                category: 'ERROR',
                message: `Failed to write exception response to client: ${String(sendErr)}`,
                requestId,
            });
        }
    }
};
exports.RadinetGlobalExceptionFilter = RadinetGlobalExceptionFilter;
exports.RadinetGlobalExceptionFilter = RadinetGlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], RadinetGlobalExceptionFilter);
