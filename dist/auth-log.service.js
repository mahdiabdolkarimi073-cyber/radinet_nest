"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLogService = void 0;
exports.generateRequestId = generateRequestId;
exports.maskEmailOrIdentifier = maskEmailOrIdentifier;
exports.sanitizeLogMetadata = sanitizeLogMetadata;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("./prisma.service");
const SENSITIVE_KEY_PATTERN = /password|pass|pwd|secret|token|cookie|authorization|auth_token|jwt|credential|private/i;
const MAX_DISK_LOGS = 2500;
function generateRequestId() {
    const ts = Date.now().toString(36);
    const rand = (0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 10);
    return `req_${ts}_${rand}`;
}
function maskEmailOrIdentifier(raw) {
    if (!raw || typeof raw !== 'string')
        return null;
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed)
        return null;
    const atIndex = trimmed.indexOf('@');
    if (atIndex > 0) {
        const local = trimmed.slice(0, atIndex);
        const domain = trimmed.slice(atIndex + 1);
        const maskedLocal = local.length <= 2
            ? `${local.charAt(0)}***`
            : `${local.charAt(0)}***${local.charAt(local.length - 1)}`;
        const dotIndex = domain.lastIndexOf('.');
        if (dotIndex > 1) {
            const domainName = domain.slice(0, dotIndex);
            const tld = domain.slice(dotIndex);
            const maskedDomain = domainName.length <= 2
                ? `${domainName.charAt(0)}**`
                : `${domainName.charAt(0)}***${domainName.charAt(domainName.length - 1)}`;
            return `${maskedLocal}@${maskedDomain}${tld}`;
        }
        return `${maskedLocal}@***`;
    }
    if (trimmed.length <= 3)
        return '***';
    return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
}
function sanitizeLogMetadata(input) {
    if (!input || typeof input !== 'object')
        return {};
    const clean = {};
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
            clean[key] = value.slice(0, 20).map((item) => typeof item === 'string' && item.length > 300 ? `${item.slice(0, 300)}...` : item);
        }
        else if (value && typeof value === 'object') {
            clean[key] = sanitizeLogMetadata(value);
        }
        else if (typeof value === 'string' && value.length > 500) {
            clean[key] = `${value.slice(0, 500)}...`;
        }
        else {
            clean[key] = value;
        }
    }
    return clean;
}
let AuthLogService = class AuthLogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.dbTableReady = false;
        const dataDir = path.join(process.cwd(), '.data');
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            catch {
                // Ignore directory creation errors if read-only
            }
        }
        this.logFilePath = path.join(dataDir, 'auth-system-logs.json');
    }
    async onModuleInit() {
        await this.ensureDatabaseTable();
    }
    async ensureDatabaseTable() {
        if (this.dbTableReady)
            return true;
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
        }
        catch {
            return false;
        }
    }
    readDiskLogs() {
        try {
            if (!fs.existsSync(this.logFilePath))
                return [];
            const raw = fs.readFileSync(this.logFilePath, 'utf-8');
            if (!raw.trim())
                return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    appendDiskLog(record) {
        try {
            const existing = this.readDiskLogs();
            const deduplicated = existing.filter((item) => !(item.requestId === record.requestId && item.source === record.source && item.operation === record.operation));
            const updated = [record, ...deduplicated].slice(0, MAX_DISK_LOGS);
            const dir = path.dirname(this.logFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.logFilePath, JSON.stringify(updated, null, 2), 'utf-8');
        }
        catch {
            // Ignore disk write issues if filesystem is read-only
        }
    }
    async recordLog(input) {
        const nowIso = new Date().toISOString();
        const startedAtIso = input.startedAt instanceof Date
            ? input.startedAt.toISOString()
            : typeof input.startedAt === 'string' && input.startedAt
                ? input.startedAt
                : nowIso;
        const completedAtIso = input.completedAt instanceof Date
            ? input.completedAt.toISOString()
            : typeof input.completedAt === 'string' && input.completedAt
                ? input.completedAt
                : nowIso;
        const maskedIdentifier = input.maskedIdentifier ?? maskEmailOrIdentifier(input.rawIdentifier) ?? null;
        const safeMetadata = sanitizeLogMetadata(input.metadata);
        const record = {
            id: (0, crypto_1.randomUUID)(),
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
            dtoValidationPassed: typeof input.dtoValidationPassed === 'boolean' ? input.dtoValidationPassed : null,
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
        }
        else if (record.level === 'WARN') {
            console.warn(`[RADINET_BACKEND] [AUTH] [WARN] ${structuredConsoleLine}`);
        }
        else {
            console.log(`[RADINET_BACKEND] [AUTH] [INFO] ${structuredConsoleLine}`);
        }
        // 1. Always persist to disk file
        this.appendDiskLog(record);
        // 2. Persist to PostgreSQL database table
        try {
            const tableOk = await this.ensureDatabaseTable();
            if (tableOk) {
                await this.prisma.$executeRawUnsafe(`INSERT INTO "system_auth_logs" (
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
          ) ON CONFLICT ("id") DO NOTHING`, record.id, record.requestId, record.source, record.level, record.operation, record.method, record.routePath, record.targetUrl, record.statusCode, record.durationMs, record.backendReached, record.dtoValidationPassed, record.operationResult, record.connectionStatus, record.failureStage, record.errorCategory, record.errorMessage, record.maskedIdentifier, record.responseType, JSON.stringify(record.metadata), record.startedAt, record.completedAt, record.createdAt);
            }
        }
        catch {
            // Disk log already succeeded; continue without throwing
        }
        return record;
    }
    async readDbLogs(limit = 1000) {
        try {
            const tableOk = await this.ensureDatabaseTable();
            if (!tableOk)
                return [];
            const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM "system_auth_logs" ORDER BY "created_at" DESC LIMIT $1`, limit);
            if (!Array.isArray(rows))
                return [];
            return rows.map((r) => ({
                id: String(r.id),
                requestId: String(r.request_id),
                source: r.source || 'backend',
                level: r.level || 'INFO',
                operation: String(r.operation),
                method: String(r.method || 'POST'),
                routePath: String(r.route_path || ''),
                targetUrl: String(r.target_url || ''),
                statusCode: Number(r.status_code ?? 200),
                durationMs: Number(r.duration_ms ?? 0),
                backendReached: Boolean(r.backend_reached),
                dtoValidationPassed: typeof r.dto_validation_passed === 'boolean' ? r.dto_validation_passed : null,
                operationResult: String(r.operation_result || 'SUCCESS'),
                connectionStatus: String(r.connection_status || 'CONNECTED'),
                failureStage: String(r.failure_stage || 'NONE'),
                errorCategory: String(r.error_category || 'NONE'),
                errorMessage: r.error_message ? String(r.error_message) : null,
                maskedIdentifier: r.masked_identifier ? String(r.masked_identifier) : null,
                responseType: String(r.response_type || 'json'),
                metadata: typeof r.metadata === 'string'
                    ? JSON.parse(r.metadata)
                    : (r.metadata ?? {}),
                startedAt: r.started_at instanceof Date ? r.started_at.toISOString() : String(r.started_at),
                completedAt: r.completed_at instanceof Date ? r.completed_at.toISOString() : String(r.completed_at),
                createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
            }));
        }
        catch {
            return [];
        }
    }
    async queryLogs(filters = {}) {
        const [dbLogs, diskLogs] = await Promise.all([this.readDbLogs(1200), Promise.resolve(this.readDiskLogs())]);
        // Merge and deduplicate by (requestId + source + operation + createdAt)
        const map = new Map();
        for (const item of [...dbLogs, ...diskLogs]) {
            const key = `${item.requestId}::${item.source}::${item.operation}`;
            if (!map.has(key)) {
                map.set(key, item);
            }
        }
        const allItems = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const filtered = allItems.filter((item) => {
            if (filters.requestId?.trim()) {
                const q = filters.requestId.trim().toLowerCase();
                if (!item.requestId.toLowerCase().includes(q))
                    return false;
            }
            if (filters.operation && filters.operation !== 'all') {
                if (item.operation.toUpperCase() !== filters.operation.toUpperCase())
                    return false;
            }
            if (filters.level && filters.level !== 'all') {
                if (item.level.toUpperCase() !== filters.level.toUpperCase())
                    return false;
            }
            if (filters.source && filters.source !== 'all') {
                if (item.source !== filters.source)
                    return false;
            }
            if (filters.backendReached && filters.backendReached !== 'all') {
                const expected = filters.backendReached === 'true' || filters.backendReached === 'reached';
                if (item.backendReached !== expected)
                    return false;
            }
            if (filters.status && filters.status !== 'all') {
                if (filters.status === 'success' && item.operationResult !== 'SUCCESS')
                    return false;
                if (filters.status === 'failed' && item.operationResult !== 'FAILED')
                    return false;
            }
            if (filters.statusCode && filters.statusCode !== 'all') {
                if (filters.statusCode === 'network') {
                    if (item.statusCode !== 0 && item.connectionStatus !== 'NETWORK_ERROR' && item.connectionStatus !== 'CORS_ERROR' && item.connectionStatus !== 'TIMEOUT') {
                        return false;
                    }
                }
                else if (filters.statusCode === '5xx') {
                    if (item.statusCode < 500)
                        return false;
                }
                else {
                    const codeNum = Number(filters.statusCode);
                    if (Number.isFinite(codeNum) && item.statusCode !== codeNum)
                        return false;
                }
            }
            if (filters.fromDate?.trim()) {
                const fromTs = new Date(filters.fromDate.trim()).getTime();
                if (Number.isFinite(fromTs) && new Date(item.createdAt).getTime() < fromTs)
                    return false;
            }
            if (filters.toDate?.trim()) {
                const toDateObj = new Date(filters.toDate.trim());
                toDateObj.setHours(23, 59, 59, 999);
                const toTs = toDateObj.getTime();
                if (Number.isFinite(toTs) && new Date(item.createdAt).getTime() > toTs)
                    return false;
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
                if (!hay.includes(s))
                    return false;
            }
            return true;
        });
        const summary = {
            total: allItems.length,
            successCount: allItems.filter((i) => i.operationResult === 'SUCCESS').length,
            failedCount: allItems.filter((i) => i.operationResult === 'FAILED').length,
            backendReachedCount: allItems.filter((i) => i.backendReached).length,
            notReachedBackendCount: allItems.filter((i) => !i.backendReached).length,
            avgDurationMs: allItems.length > 0
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
                network: allItems.filter((i) => i.statusCode === 0 ||
                    i.connectionStatus === 'NETWORK_ERROR' ||
                    i.connectionStatus === 'CORS_ERROR' ||
                    i.connectionStatus === 'TIMEOUT').length,
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
    async checkDatabaseHealth() {
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
        }
        catch (err) {
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
};
exports.AuthLogService = AuthLogService;
exports.AuthLogService = AuthLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthLogService);
