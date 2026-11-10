import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logRadinet } from './radinet-logger';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    const startedAt = Date.now();
    logRadinet({
      level: 'INFO',
      category: 'DATABASE',
      message: 'Connecting to PostgreSQL database via Prisma...',
      details: {
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
        databaseHost: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || '[CONFIGURED]'
          : 'NONE',
      },
    });

    try {
      await this.$connect();
      // Perform a ping query to verify database response
      await this.$queryRaw`SELECT 1 as ping`;
      const durationMs = Date.now() - startedAt;

      logRadinet({
        level: 'INFO',
        category: 'DATABASE',
        message: `PostgreSQL database connected and verified successfully (${durationMs}ms)`,
        durationMs,
      });
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string; stack?: string };
      logRadinet({
        level: 'ERROR',
        category: 'DATABASE',
        message: `Prisma/PostgreSQL connection failed: ${err?.message || String(e)}`,
        error: err?.message || String(e),
        stack: err?.stack,
        details: {
          code: err?.code,
          hint: 'Database might be offline, credentials invalid, or firewall blocking connection. App will start with graceful degradation.',
        },
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      logRadinet({
        level: 'INFO',
        category: 'DATABASE',
        message: 'Disconnecting Prisma Client...',
      });
      await this.$disconnect();
    } catch (err: unknown) {
      logRadinet({
        level: 'WARN',
        category: 'DATABASE',
        message: `Prisma disconnect warning: ${String(err)}`,
      });
    }
  }
}