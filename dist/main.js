"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const radinet_exception_filter_1 = require("./radinet-exception.filter");
const radinet_logger_1 = require("./radinet-logger");
const radinet_logging_interceptor_1 = require("./radinet-logging.interceptor");
// ── Global Process Event Handlers (Unhandled Exceptions & Rejections) ──
process.on('uncaughtException', (err) => {
    (0, radinet_logger_1.logRadinet)({
        level: 'ERROR',
        category: 'UNCAUGHT',
        message: `Fatal Uncaught Exception: ${err?.message || String(err)}`,
        error: err?.message || String(err),
        stack: err?.stack,
    });
});
process.on('unhandledRejection', (reason) => {
    const err = reason;
    (0, radinet_logger_1.logRadinet)({
        level: 'ERROR',
        category: 'UNCAUGHT',
        message: `Fatal Unhandled Promise Rejection: ${err?.message || String(reason)}`,
        error: err?.message || String(reason),
        stack: err?.stack,
    });
});
const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
for (const signal of shutdownSignals) {
    process.on(signal, () => {
        (0, radinet_logger_1.logRadinet)({
            level: 'WARN',
            category: 'SHUTDOWN',
            message: `Received shutdown signal [${signal}]. Starting graceful shutdown...`,
            details: {
                signal,
                uptimeSeconds: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
            },
        });
    });
}
process.on('exit', (code) => {
    (0, radinet_logger_1.logRadinet)({
        level: code === 0 ? 'INFO' : 'ERROR',
        category: 'SHUTDOWN',
        message: `Backend process exiting with code [${code}]`,
        details: { exitCode: code, uptimeSeconds: Math.floor(process.uptime()) },
    });
});
async function bootstrap() {
    const startBootTime = Date.now();
    const rawPort = process.env.PORT;
    const port = Number(rawPort) || 4000;
    const host = process.env.HOST || '0.0.0.0';
    const nodeEnv = process.env.NODE_ENV || 'development';
    (0, radinet_logger_1.logRadinet)({
        level: 'INFO',
        category: 'STARTUP',
        message: 'Starting Radinet NestJS backend application...',
        details: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            nodeEnv,
            configuredPortEnv: rawPort ?? '[NOT_SET]',
            targetPort: port,
            targetHost: host,
            cwd: process.cwd(),
            pid: process.pid,
            startTime: new Date().toISOString(),
        },
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.set('trust proxy', 1);
    // Global early request middleware to guarantee Request ID & start time on every HTTP socket
    app.use((req, res, next) => {
        const rawReqId = req.headers['x-request-id'] || req.headers['X-Request-ID'];
        const reqId = (0, radinet_logger_1.getRequestIdFromHeader)(rawReqId);
        req.requestId = reqId;
        req.startTime = Date.now();
        try {
            res.setHeader('X-Request-ID', reqId);
            res.setHeader('X-Backend-Reached', 'true');
        }
        catch {
            // Headers already sent check
        }
        next();
    });
    const envOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? '')
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    const allowedOrigins = new Set([
        'https://radinet24.com',
        'https://www.radinet24.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        ...envOrigins,
    ]);
    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin) {
                callback(null, true);
                return;
            }
            const normalized = requestOrigin.replace(/\/+$/, '');
            if (allowedOrigins.has(normalized) || envOrigins.includes('*')) {
                callback(null, true);
                return;
            }
            (0, radinet_logger_1.logRadinet)({
                level: 'WARN',
                category: 'REQUEST',
                message: `CORS blocked request from origin: ${requestOrigin}`,
                details: { blockedOrigin: requestOrigin, allowedCount: allowedOrigins.size },
            });
            callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'X-Requested-With',
            'X-Request-ID',
            'x-request-id',
        ],
        exposedHeaders: ['X-Request-ID', 'X-Backend-Reached'],
    });
    app.setGlobalPrefix('api');
    // Register Global Interceptor & Exception Filter
    app.useGlobalInterceptors(new radinet_logging_interceptor_1.RadinetLoggingInterceptor());
    app.useGlobalFilters(new radinet_exception_filter_1.RadinetGlobalExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads/' });
    try {
        await app.listen(port, host);
        const bootDurationMs = Date.now() - startBootTime;
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'STARTUP',
            message: `Radinet Backend is now LISTENING on http://${host}:${port} (${bootDurationMs}ms startup time)`,
            details: {
                host,
                port,
                url: `http://${host}:${port}`,
                globalPrefix: 'api',
                readyAt: new Date().toISOString(),
                corsOrigins: Array.from(allowedOrigins),
                status: 'ONLINE',
            },
        });
    }
    catch (listenError) {
        const err = listenError;
        (0, radinet_logger_1.logRadinet)({
            level: 'ERROR',
            category: 'STARTUP',
            message: `CRITICAL: Failed to bind port ${port} on host ${host}: ${err?.message || String(listenError)}`,
            error: err?.message || String(listenError),
            stack: err?.stack,
            details: {
                code: err?.code,
                port,
                host,
                hint: err?.code === 'EADDRINUSE'
                    ? `Port ${port} is already in use by another process. Check 'fuser ${port}/tcp' or change PORT env var.`
                    : err?.code === 'EACCES'
                        ? `Permission denied to bind to port ${port}. Non-root processes cannot bind ports < 1024.`
                        : 'Network or interface binding error.',
            },
        });
        process.exit(1);
    }
}
void bootstrap();
