import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { AppModule } from './app.module';
import { RadinetGlobalExceptionFilter } from './radinet-exception.filter';
import { getRequestIdFromHeader, logRadinet } from './radinet-logger';
import { RadinetLoggingInterceptor } from './radinet-logging.interceptor';

// ── Global Process Event Handlers (Unhandled Exceptions & Rejections) ──

process.on('uncaughtException', (err: Error) => {
  logRadinet({
    level: 'ERROR',
    category: 'UNCAUGHT',
    message: `Fatal Uncaught Exception: ${err?.message || String(err)}`,
    error: err?.message || String(err),
    stack: err?.stack,
  });
});

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason as { message?: string; stack?: string } | null;
  logRadinet({
    level: 'ERROR',
    category: 'UNCAUGHT',
    message: `Fatal Unhandled Promise Rejection: ${err?.message || String(reason)}`,
    error: err?.message || String(reason),
    stack: err?.stack,
  });
});

const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP'];
for (const signal of shutdownSignals) {
  process.on(signal, () => {
    logRadinet({
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

process.on('exit', (code: number) => {
  logRadinet({
    level: code === 0 ? 'INFO' : 'ERROR',
    category: 'SHUTDOWN',
    message: `Backend process exiting with code [${code}]`,
    details: { exitCode: code, uptimeSeconds: Math.floor(process.uptime()) },
  });
});

async function bootstrap(): Promise<void> {
  const startBootTime = Date.now();
  const rawPort = process.env.PORT;
  const port = Number(rawPort) || 4000;
  const host = process.env.HOST || '0.0.0.0';
  const nodeEnv = process.env.NODE_ENV || 'development';

  logRadinet({
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

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  // Global early request middleware to guarantee Request ID & start time on every HTTP socket
  app.use(
    (
      req: IncomingMessage & {
        requestId?: string;
        startTime?: number;
        originalUrl?: string;
      },
      res: ServerResponse & {
        setHeader: (name: string, value: string | number | readonly string[]) => unknown;
      },
      next: () => void,
    ) => {
      const rawReqId = req.headers['x-request-id'] || req.headers['X-Request-ID'];
      const reqId = getRequestIdFromHeader(rawReqId);
      req.requestId = reqId;
      req.startTime = Date.now();

      try {
        res.setHeader('X-Request-ID', reqId);
        res.setHeader('X-Backend-Reached', 'true');
      } catch {
        // Headers already sent check
      }
      next();
    },
  );

  const envOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = new Set<string>([
    'https://radinet24.com',
    'https://www.radinet24.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...envOrigins,
  ]);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      const normalized = requestOrigin.replace(/\/+$/, '');
      if (allowedOrigins.has(normalized) || envOrigins.includes('*')) {
        callback(null, true);
        return;
      }
      logRadinet({
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
  app.useGlobalInterceptors(new RadinetLoggingInterceptor());
  app.useGlobalFilters(new RadinetGlobalExceptionFilter());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  try {
    await app.listen(port, host);
    const bootDurationMs = Date.now() - startBootTime;

    logRadinet({
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
  } catch (listenError: unknown) {
    const err = listenError as { message?: string; code?: string; stack?: string };
    logRadinet({
      level: 'ERROR',
      category: 'STARTUP',
      message: `CRITICAL: Failed to bind port ${port} on host ${host}: ${err?.message || String(listenError)}`,
      error: err?.message || String(listenError),
      stack: err?.stack,
      details: {
        code: err?.code,
        port,
        host,
        hint:
          err?.code === 'EADDRINUSE'
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
