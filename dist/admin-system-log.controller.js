"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSystemLogController = void 0;
const common_1 = require("@nestjs/common");
const auth_token_1 = require("./auth-token");
const auth_log_service_1 = require("./auth-log.service");
let AdminSystemLogController = class AdminSystemLogController {
    constructor(authLogService) {
        this.authLogService = authLogService;
    }
    async listSystemLogs(auth, incomingRequestId, res, requestId, operation, level, status, statusCode, backendReached, source, fromDate, toDate, search, page, limit) {
        (0, auth_token_1.verifyAdminToken)(auth);
        const traceId = incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', traceId);
        res.setHeader('X-Backend-Reached', 'true');
        const [logsResult, health] = await Promise.all([
            this.authLogService.queryLogs({
                requestId,
                operation,
                level,
                status,
                statusCode,
                backendReached,
                source,
                fromDate,
                toDate,
                search,
                page: page ? Number.parseInt(page, 10) : 1,
                limit: limit ? Number.parseInt(limit, 10) : 25,
            }),
            this.authLogService.checkDatabaseHealth(),
        ]);
        return {
            ok: true,
            requestId: traceId,
            backendHealth: {
                backendOnline: true,
                ...health,
                checkedAt: new Date().toISOString(),
            },
            ...logsResult,
        };
    }
    async ingestFrontendLog(incomingRequestId, body, res) {
        const traceId = body?.requestId || incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', traceId);
        res.setHeader('X-Backend-Reached', 'true');
        if (!body || typeof body !== 'object' || !body.operation || !body.routePath) {
            return { ok: false, requestId: traceId };
        }
        const record = await this.authLogService.recordLog({
            ...body,
            requestId: traceId,
            source: body.source === 'frontend-client' ? 'frontend-client' : 'frontend-proxy',
        });
        return {
            ok: true,
            requestId: traceId,
            id: record.id,
        };
    }
};
exports.AdminSystemLogController = AdminSystemLogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Headers)('x-request-id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __param(3, (0, common_1.Query)('requestId')),
    __param(4, (0, common_1.Query)('operation')),
    __param(5, (0, common_1.Query)('level')),
    __param(6, (0, common_1.Query)('status')),
    __param(7, (0, common_1.Query)('statusCode')),
    __param(8, (0, common_1.Query)('backendReached')),
    __param(9, (0, common_1.Query)('source')),
    __param(10, (0, common_1.Query)('fromDate')),
    __param(11, (0, common_1.Query)('toDate')),
    __param(12, (0, common_1.Query)('search')),
    __param(13, (0, common_1.Query)('page')),
    __param(14, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminSystemLogController.prototype, "listSystemLogs", null);
__decorate([
    (0, common_1.Post)('ingest'),
    __param(0, (0, common_1.Headers)('x-request-id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminSystemLogController.prototype, "ingestFrontendLog", null);
exports.AdminSystemLogController = AdminSystemLogController = __decorate([
    (0, common_1.Controller)('admin/system-logs'),
    __metadata("design:paramtypes", [auth_log_service_1.AuthLogService])
], AdminSystemLogController);
