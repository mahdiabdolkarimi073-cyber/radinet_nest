import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from './prisma.service';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogSource = 'backend' | 'frontend-proxy' | 'frontend-client';
export type AuthOperation = 'REGISTER' | 'LOGIN' | 'AUTH_ME' | 'HEALTH_CHECK';
export type OperationResult = 'SUCCESS' | 'FAILED';

export interface HttpResponse {
  setHeader(name: string, value: number | string | readonly string[]): unknown;
  status(code: number): unknown;
}

export type SystemAuthLogRecord = {
  id: string;
  requestId: string;
  source: LogSource;
  level: LogLevel;
  operation: AuthOperation | string;
  method: string;
  routePath: string;
  targetUrl: string;
  statusCode: number;
  durationMs: number;
  backendReached: boolean;
  dtoValidationPassed: boolean | null;
  operationResult: OperationResult | string;
  connectionStatus: string;
  failureStage: string;
  errorCategory: string;
  errorMessage: string | null;
  maskedIdentifier: string | null;
  responseType: string;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string;
  createdAt: string;
};

export type CreateAuthLogInput = {
  requestId?: string;
  source?: LogSource;
  level: LogLevel;
  operation: AuthOperation | string;
  method?: string;
  routePath: string;
  targetUrl?: string;
  statusCode: number;
  durationMs: number;
  backendReached?: boolean;
  dtoValidationPassed?: boolean | null;
  operationResult: OperationResult | string;
  connectionStatus?: string;
  failureStage?: string;
  errorCategory?: string;
  errorMessage?: string | null;
  rawIdentifier?: string | null;
  maskedIdentifier?: string | null;
  responseType?: string;
  metadata?: Record<string, unknown>;
  startedAt?: Date | string;
  completedAt?: Date | string;
};

export type AuthLogQueryParams = {
  requestId?: string;
  operation?: string;
  level?: string;
  status?: string;
  statusCode?: string;
  backendReached?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
};

const SENSITIVE_KEY_PATTERN = /password|pass|pwd|secret|token|cookie|authorization|auth_token|jwt|credential|private/i;
const MAX_DISK_LOGS = 2500;

export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, '').slice(0, 10);
  return `req_${ts}_${rand}`;
}

export function maskEmailOrIdentifier(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const atIndex = trimmed.indexOf('@');
  if (atIndex > 0) {
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    const maskedLocal =
      local.length <= 2
        ? `${local.charAt(0)}***`
        : `${local.charAt(0)}***${local.charAt(local.length - 1)}`;
    const dotIndex = domain.lastIndexOf('.');
    if (dotIndex > 1) {
      const domainName = domain.slice(0, dotIndex);
      const tld = domain.slice(dotIndex);
      const maskedDomain =
        domainName.length <= 2
          ? `${domainName.charAt(0)}**`
          : `${domainName.charAt(0)}***${domainName.charAt(domainName.length - 1)}`;
      return `${maskedLocal}@${maskedDomain}${tld}`;
    }
    return `${maskedLocal}@***`;
  }
  if (trimmed.length <= 3) return '***';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
}

export function sanitizeLogMetadata(input?: Record<string, unknown> | null): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = '[REDACTED]';
      continue;
    }
    if (key.toLowerCase().includes('email') && typeof value === 'string') {
      clean[key] = maskEmailOrIdentifier(value);
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.slice(0, 20).map((item) =>
        typeof item === 'string' && item.length > 300 ? `${item.slice(0, 300)}...` : item,
      );
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeLogMetadata(value as Record<string, unknown>);
    } else if (typeof value === 'string' && value.length > 500) {
      clean[key] = `${value.slice(0, 500)}...`;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

@Injectable()
export class AuthLogService implements OnModuleInit {
  private readonly logFilePath: string;
  private dbTableReady = false;

  constructor(private readonly prisma: PrismaService) {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Ignore directory creation errors if read-only
      }
    }
    this.logFilePath = path.join(dataDir, 'auth-system-logs.json');
  }

  async onModuleInit(): Promise<void> {
    await this.ensureDatabaseTable();
  }

  async ensureDatabaseTable(): Promise<boolean> {
    if (this.dbTableReady) return true;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "system_auth_logs" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "request_id" TEXT NOT NULL,
          "source" TEXT NOT NULL DEFAULT 'backend',
          "level" TEXT NOT NULL DEFAULT 'INFO',
          "operation" TEXT NOT NULL,
          "method" TEXT NOT NULL DEFAULT 'POST',
          "route_path" TEXT NOT NULL,
          "target_url" TEXT NOT NULL DEFAULT '',
          "status_code" INTEGER NOT NULL DEFAULT 200,
          "duration_ms" INTEGER NOT NULL DEFAULT 0,
          "backend_reached" BOOLEAN NOT NULL DEFAULT true,
          "dto_validation_passed" BOOLEAN,
          "operation_result" TEXT NOT NULL DEFAULT 'SUCCESS',
          "connection_status" TEXT NOT NULL DEFAULT 'CONNECTED',
          "failure_stage" TEXT NOT NULL DEFAULT 'NONE',
          "error_category" TEXT NOT NULL DEFAULT 'NONE',
          "error_message" TEXT,
          "masked_identifier" TEXT,
          "response_type" TEXT NOT NULL DEFAULT 'json',
          "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "completed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_system_auth_logs_request_id" ON "system_auth_logs" ("request_id");
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_system_auth_logs_created_at" ON "system_auth_logs" ("created_at" DESC);
      `);
      this.dbTableReady = true;
      return true;
    } catch {
      return false;
    }
  }

  private readDiskLogs(): SystemAuthLogRecord[] {
    try {
      if (!fs.existsSync(this.logFilePath)) return [];
      const raw = fs.readFileSync(this.logFilePath, 'utf-8');
      if (!raw.trim()) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SystemAuthLogRecord[]) : [];
    } catch {
      return [];
    }
  }

  private appendDiskLog(record: SystemAuthLogRecord): void {
    try {
      const existing = this.readDiskLogs();
      const deduplicated = existing.filter(
        (item) => !(item.requestId === record.requestId && item.source === record.source && item.operation === record.operation),
      );
      const updated = [record, ...deduplicated].slice(0, MAX_DISK_LOGS);
      const dir = path.dirname(this.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.logFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {
      // Ignore disk write issues if filesystem is read-only
    }
  }

  async recordLog(input: CreateAuthLogInput): Promise<SystemAuthLogRecord> {
    const nowIso = new Date().toISOString();
    const startedAtIso =
      input.startedAt instanceof Date
        ? input.startedAt.toISOString()
        : typeof input.startedAt === 'string' && input.startedAt
          ? input.startedAt
          : nowIso;
    const completedAtIso =
      input.completedAt instanceof Date
        ? input.completedAt.toISOString()
        : typeof input.completedAt === 'string' && input.completedAt
          ? input.completedAt
          : nowIso;

    const maskedIdentifier =
      input.maskedIdentifier ?? maskEmailOrIdentifier(input.rawIdentifier) ?? null;
    const safeMetadata = sanitizeLogMetadata(input.metadata);

    const record: SystemAuthLogRecord = {
      id: randomUUID(),
      requestId: (input.requestId || generateRequestId()).trim(),
      source: input.source ?? 'backend',
      level: input.level,
      operation: input.operation,
      method: (input.method ?? 'POST').toUpperCase(),
      routePath: input.routePath,
      targetUrl: input.targetUrl ?? input.routePath,
      statusCode: Number.isFinite(input.statusCode) ? input.statusCode : 500,
      durationMs: Math.max(0, Math.round(input.durationMs || 0)),
      backendReached: input.backendReached ?? true,
      dtoValidationPassed:
        typeof input.dtoValidationPassed === 'boolean' ? input.dtoValidationPassed : null,
      operationResult: input.operationResult,
      connectionStatus: input.connectionStatus ?? 'CONNECTED',
      failureStage: input.failureStage ?? 'NONE',
      errorCategory: input.errorCategory ?? 'NONE',
      errorMessage: input.errorMessage ?? null,
      maskedIdentifier,
      responseType: input.responseType ?? 'json',
      metadata: safeMetadata,
      startedAt: startedAtIso,
      completedAt: completedAtIso,
      createdAt: nowIso,
    };

    // Structured server console log (without any sensitive data) with unified prefix
    const structuredConsoleLine = JSON.stringify({
      ts: record.createdAt,
      level: record.level,
      source: record.source,
      requestId: record.requestId,
      op: record.operation,
      method: record.method,
      path: record.routePath,
      status: record.statusCode,
      durationMs: record.durationMs,
      backendReached: record.backendReached,
      dtoValid: record.dtoValidationPassed,
      result: record.operationResult,
      stage: record.failureStage,
      error: record.errorMessage,
    });
    if (record.level === 'ERROR') {
      console.error(`[RADINET_BACKEND] [AUTH] [ERROR] ${structuredConsoleLine}`);
    } else if (record.level === 'WARN') {
      console.warn(`[RADINET_BACKEND] [AUTH] [WARN] ${structuredConsoleLine}`);
    } else {
      console.log(`[RADINET_BACKEND] [AUTH] [INFO] ${structuredConsoleLine}`);
    }

    // 1. Always persist to disk file
    this.appendDiskLog(record);

    // 2. Persist to PostgreSQL database table
    try {
      const tableOk = await this.ensureDatabaseTable();
      if (tableOk) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "system_auth_logs" (
            "id", "request_id", "source", "level", "operation", "method",
            "route_path", "target_url", "status_code", "duration_ms",
            "backend_reached", "dto_validation_passed", "operation_result",
            "connection_status", "failure_stage", "error_category",
            "error_message", "masked_identifier", "response_type",
            "metadata", "started_at", "completed_at", "created_at"
          ) VALUES (
            $1::uuid, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19,
            $20::jsonb, $21::timestamptz, $22::timestamptz, $23::timestamptz
          ) ON CONFLICT ("id") DO NOTHING`,
          record.id,
          record.requestId,
          record.source,
          record.level,
          record.operation,
          record.method,
          record.routePath,
          record.targetUrl,
          record.statusCode,
          record.durationMs,
          record.backendReached,
          record.dtoValidationPassed,
          record.operationResult,
          record.connectionStatus,
          record.failureStage,
          record.errorCategory,
          record.errorMessage,
          record.maskedIdentifier,
          record.responseType,
          JSON.stringify(record.metadata),
          record.startedAt,
          record.completedAt,
          record.createdAt,
        );
      }
    } catch {
      // Disk log already succeeded; continue without throwing
    }

    return record;
  }

  private async readDbLogs(limit = 1000): Promise<SystemAuthLogRecord[]> {
    try {
      const tableOk = await this.ensureDatabaseTable();
      if (!tableOk) return [];
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{
          id: string;
          request_id: string;
          source: string;
          level: string;
          operation: string;
          method: string;
          route_path: string;
          target_url: string;
          status_code: number;
          duration_ms: number;
          backend_reached: boolean;
          dto_validation_passed: boolean | null;
          operation_result: string;
          connection_status: string;
          failure_stage: string;
          error_category: string;
          error_message: string | null;
          masked_identifier: string | null;
          response_type: string;
          metadata: Record<string, unknown> | string;
          started_at: Date | string;
          completed_at: Date | string;
          created_at: Date | string;
        }>
      >(
        `SELECT * FROM "system_auth_logs" ORDER BY "created_at" DESC LIMIT $1`,
        limit,
      );
      if (!Array.isArray(rows)) return [];
      return rows.map((r) => ({
        id: String(r.id),
        requestId: String(r.request_id),
        source: (r.source as LogSource) || 'backend',
        level: (r.level as LogLevel) || 'INFO',
        operation: String(r.operation),
        method: String(r.method || 'POST'),
        routePath: String(r.route_path || ''),
        targetUrl: String(r.target_url || ''),
        statusCode: Number(r.status_code ?? 200),
        durationMs: Number(r.duration_ms ?? 0),
        backendReached: Boolean(r.backend_reached),
        dtoValidationPassed:
          typeof r.dto_validation_passed === 'boolean' ? r.dto_validation_passed : null,
        operationResult: String(r.operation_result || 'SUCCESS'),
        connectionStatus: String(r.connection_status || 'CONNECTED'),
        failureStage: String(r.failure_stage || 'NONE'),
        errorCategory: String(r.error_category || 'NONE'),
        errorMessage: r.error_message ? String(r.error_message) : null,
        maskedIdentifier: r.masked_identifier ? String(r.masked_identifier) : null,
        responseType: String(r.response_type || 'json'),
        metadata:
          typeof r.metadata === 'string'
            ? (JSON.parse(r.metadata) as Record<string, unknown>)
            : (r.metadata ?? {}),
        startedAt:
          r.started_at instanceof Date ? r.started_at.toISOString() : String(r.started_at),
        completedAt:
          r.completed_at instanceof Date ? r.completed_at.toISOString() : String(r.completed_at),
        createdAt:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      }));
    } catch {
      return [];
    }
  }

  async queryLogs(filters: AuthLogQueryParams = {}) {
    const [dbLogs, diskLogs] = await Promise.all([this.readDbLogs(1200), Promise.resolve(this.readDiskLogs())]);

    // Merge and deduplicate by (requestId + source + operation + createdAt)
    const map = new Map<string, SystemAuthLogRecord>();
    for (const item of [...dbLogs, ...diskLogs]) {
      const key = `${item.requestId}::${item.source}::${item.operation}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    const allItems = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const filtered = allItems.filter((item) => {
      if (filters.requestId?.trim()) {
        const q = filters.requestId.trim().toLowerCase();
        if (!item.requestId.toLowerCase().includes(q)) return false;
      }
      if (filters.operation && filters.operation !== 'all') {
        if (item.operation.toUpperCase() !== filters.operation.toUpperCase()) return false;
      }
      if (filters.level && filters.level !== 'all') {
        if (item.level.toUpperCase() !== filters.level.toUpperCase()) return false;
      }
      if (filters.source && filters.source !== 'all') {
        if (item.source !== filters.source) return false;
      }
      if (filters.backendReached && filters.backendReached !== 'all') {
        const expected = filters.backendReached === 'true' || filters.backendReached === 'reached';
        if (item.backendReached !== expected) return false;
      }
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'success' && item.operationResult !== 'SUCCESS') return false;
        if (filters.status === 'failed' && item.operationResult !== 'FAILED') return false;
      }
      if (filters.statusCode && filters.statusCode !== 'all') {
        if (filters.statusCode === 'network') {
          if (item.statusCode !== 0 && item.connectionStatus !== 'NETWORK_ERROR' && item.connectionStatus !== 'CORS_ERROR' && item.connectionStatus !== 'TIMEOUT') {
            return false;
          }
        } else if (filters.statusCode === '5xx') {
          if (item.statusCode < 500) return false;
        } else {
          const codeNum = Number(filters.statusCode);
          if (Number.isFinite(codeNum) && item.statusCode !== codeNum) return false;
        }
      }
      if (filters.fromDate?.trim()) {
        const fromTs = new Date(filters.fromDate.trim()).getTime();
        if (Number.isFinite(fromTs) && new Date(item.createdAt).getTime() < fromTs) return false;
      }
      if (filters.toDate?.trim()) {
        const toDateObj = new Date(filters.toDate.trim());
        toDateObj.setHours(23, 59, 59, 999);
        const toTs = toDateObj.getTime();
        if (Number.isFinite(toTs) && new Date(item.createdAt).getTime() > toTs) return false;
      }
      if (filters.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        const hay = [
          item.requestId,
          item.routePath,
          item.targetUrl,
          item.operation,
          item.failureStage,
          item.errorCategory,
          item.errorMessage ?? '',
          item.maskedIdentifier ?? '',
          String(item.statusCode),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });

    const summary = {
      total: allItems.length,
      successCount: allItems.filter((i) => i.operationResult === 'SUCCESS').length,
      failedCount: allItems.filter((i) => i.operationResult === 'FAILED').length,
      backendReachedCount: allItems.filter((i) => i.backendReached).length,
      notReachedBackendCount: allItems.filter((i) => !i.backendReached).length,
      avgDurationMs:
        allItems.length > 0
          ? Math.round(allItems.reduce((acc, i) => acc + (i.durationMs || 0), 0) / allItems.length)
          : 0,
      statusBreakdown: {
        s200: allItems.filter((i) => i.statusCode >= 200 && i.statusCode < 300).length,
        s400: allItems.filter((i) => i.statusCode === 400).length,
        s401: allItems.filter((i) => i.statusCode === 401).length,
        s403: allItems.filter((i) => i.statusCode === 403).length,
        s404: allItems.filter((i) => i.statusCode === 404).length,
        s409: allItems.filter((i) => i.statusCode === 409).length,
        s500: allItems.filter((i) => i.statusCode >= 500).length,
        network: allItems.filter(
          (i) =>
            i.statusCode === 0 ||
            i.connectionStatus === 'NETWORK_ERROR' ||
            i.connectionStatus === 'CORS_ERROR' ||
            i.connectionStatus === 'TIMEOUT',
        ).length,
      },
    };

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 25, 1), 100);
    const startIdx = (page - 1) * limit;
    const paginated = filtered.slice(startIdx, startIdx + limit);

    return {
      items: paginated,
      total: filtered.length,
      page,
      limit,
      pages: Math.max(Math.ceil(filtered.length / limit), 1),
      summary,
    };
  }

  async checkDatabaseHealth(): Promise<{
    databaseConnected: boolean;
    usersTableReady: boolean;
    logsTableReady: boolean;
    userCount: number | null;
    dbError: string | null;
  }> {
    try {
      const userCount = await this.prisma.user.count();
      const logsTableReady = await this.ensureDatabaseTable();
      return {
        databaseConnected: true,
        usersTableReady: true,
        logsTableReady,
        userCount,
        dbError: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database connection error';
      return {
        databaseConnected: false,
        usersTableReady: false,
        logsTableReady: this.dbTableReady,
        userCount: null,
        dbError: msg.slice(0, 300),
      };
    }
  }
}
