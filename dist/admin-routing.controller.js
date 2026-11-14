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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutingController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function verifyAdmin(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (payload.role !== 'admin')
            throw new common_1.UnauthorizedException('دسترسی مجاز نیست');
        return payload;
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class CreateRoutingRuleDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateRoutingRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRoutingRuleDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingRuleDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingRuleDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingRuleDto.prototype, "urgency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateRoutingRuleDto.prototype, "maxWorkload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingRuleDto.prototype, "preferredDoctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRoutingRuleDto.prototype, "isActive", void 0);
class UpdateRoutingRuleDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutingRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateRoutingRuleDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutingRuleDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutingRuleDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutingRuleDto.prototype, "urgency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateRoutingRuleDto.prototype, "maxWorkload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutingRuleDto.prototype, "preferredDoctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRoutingRuleDto.prototype, "isActive", void 0);
class RoutingLogQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingLogQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingLogQueryDto.prototype, "assignedDoctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingLogQueryDto.prototype, "success", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingLogQueryDto.prototype, "limit", void 0);
let AdminRoutingController = class AdminRoutingController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Routing Rules ──
    async listRules(auth) {
        verifyAdmin(auth);
        return this.prisma.routingRule.findMany({
            orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getRule(auth, id) {
        verifyAdmin(auth);
        const rule = await this.prisma.routingRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('قانون مسیریابی یافت نشد');
        return rule;
    }
    async createRule(auth, dto) {
        verifyAdmin(auth);
        if (dto.preferredDoctorId) {
            const doctor = await this.prisma.doctorProfile.findUnique({
                where: { id: dto.preferredDoctorId },
            });
            if (!doctor)
                throw new common_1.BadRequestException('پزشک انتخاب‌شده یافت نشد');
        }
        return this.prisma.routingRule.create({
            data: {
                name: dto.name,
                priority: dto.priority ?? 0,
                specialty: dto.specialty ?? '',
                imagingType: dto.imagingType ?? '',
                urgency: dto.urgency ?? 'normal',
                maxWorkload: dto.maxWorkload ?? 10,
                preferredDoctorId: dto.preferredDoctorId,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateRule(auth, id, dto) {
        verifyAdmin(auth);
        const rule = await this.prisma.routingRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('قانون مسیریابی یافت نشد');
        if (dto.preferredDoctorId) {
            const doctor = await this.prisma.doctorProfile.findUnique({
                where: { id: dto.preferredDoctorId },
            });
            if (!doctor)
                throw new common_1.BadRequestException('پزشک انتخاب‌شده یافت نشد');
        }
        return this.prisma.routingRule.update({
            where: { id },
            data: dto,
        });
    }
    async deleteRule(auth, id) {
        verifyAdmin(auth);
        const rule = await this.prisma.routingRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('قانون مسیریابی یافت نشد');
        await this.prisma.routingRule.delete({ where: { id } });
        return { ok: true };
    }
    // ── Routing Logs ──
    async listLogs(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.assignedDoctorId && query.assignedDoctorId !== 'all') {
            where.assignedDoctorId = query.assignedDoctorId;
        }
        if (query.success === 'true')
            where.success = true;
        else if (query.success === 'false')
            where.success = false;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { algorithm: { contains: value, mode: 'insensitive' } },
                { reason: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.routingLog.count({ where }),
            this.prisma.routingLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    // ── Routing Performance Stats ──
    async getRoutingStats(auth) {
        verifyAdmin(auth);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [totalLogs, successCount, failedCount, todayCount, weekCount, monthCount, avgProcessingTime] = await Promise.all([
            this.prisma.routingLog.count(),
            this.prisma.routingLog.count({ where: { success: true } }),
            this.prisma.routingLog.count({ where: { success: false } }),
            this.prisma.routingLog.count({ where: { createdAt: { gte: startOfDay } } }),
            this.prisma.routingLog.count({ where: { createdAt: { gte: startOfWeek } } }),
            this.prisma.routingLog.count({ where: { createdAt: { gte: startOfMonth } } }),
            this.prisma.routingLog.aggregate({ _avg: { processingTimeMs: true } }),
        ]);
        const activeRules = await this.prisma.routingRule.count({ where: { isActive: true } });
        const totalRules = await this.prisma.routingRule.count();
        return {
            totalLogs,
            successRate: totalLogs > 0 ? Math.round((successCount / totalLogs) * 10000) / 100 : 0,
            successCount,
            failedCount,
            todayCount,
            weekCount,
            monthCount,
            avgProcessingTimeMs: avgProcessingTime._avg.processingTimeMs ?? 0,
            rules: { active: activeRules, total: totalRules },
        };
    }
};
exports.AdminRoutingController = AdminRoutingController;
__decorate([
    (0, common_1.Get)('rules'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "listRules", null);
__decorate([
    (0, common_1.Get)('rules/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "getRule", null);
__decorate([
    (0, common_1.Post)('rules'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateRoutingRuleDto]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "createRule", null);
__decorate([
    (0, common_1.Patch)('rules/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateRoutingRuleDto]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Delete)('rules/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "deleteRule", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RoutingLogQueryDto]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "listLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRoutingController.prototype, "getRoutingStats", null);
exports.AdminRoutingController = AdminRoutingController = __decorate([
    (0, common_1.Controller)('admin/routing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminRoutingController);
