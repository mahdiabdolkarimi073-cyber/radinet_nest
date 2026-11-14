"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadinetLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const radinet_logger_1 = require("./radinet-logger");
let RadinetLoggingInterceptor = class RadinetLoggingInterceptor {
    intercept(context, next) {
        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest();
        const res = httpCtx.getResponse();
        const start = req?.startTime || Date.now();
        const rawReqId = req?.requestId ||
            req?.headers?.['x-request-id'] ||
            req?.headers?.['X-Request-ID'];
        const requestId = (0, radinet_logger_1.getRequestIdFromHeader)(rawReqId);
        if (req) {
            req.requestId = requestId;
        }
        if (res?.setHeader) {
            res.setHeader('X-Request-ID', requestId);
            res.setHeader('X-Backend-Reached', 'true');
        }
        const method = req?.method || 'UNKNOWN';
        const url = req?.originalUrl || req?.url || '/';
        const clientIp = (typeof req?.headers?.['x-forwarded-for'] === 'string'
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : null) ||
            req?.ip ||
            req?.connection?.remoteAddress ||
            req?.socket?.remoteAddress ||
            'unknown';
        (0, radinet_logger_1.logRadinet)({
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
        return next.handle().pipe((0, operators_1.tap)(() => {
            const durationMs = Date.now() - start;
            const statusCode = res?.statusCode || 200;
            const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
            (0, radinet_logger_1.logRadinet)({
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
        }), (0, operators_1.catchError)((err) => {
            const durationMs = Date.now() - start;
            const errObj = err;
            const statusCode = errObj?.status || errObj?.statusCode || 500;
            const level = statusCode >= 500 ? 'ERROR' : 'WARN';
            (0, radinet_logger_1.logRadinet)({
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
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.RadinetLoggingInterceptor = RadinetLoggingInterceptor;
exports.RadinetLoggingInterceptor = RadinetLoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], RadinetLoggingInterceptor);
