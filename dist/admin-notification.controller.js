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
exports.AdminNotificationController = void 0;
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
class SendNotificationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "targetAudience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "targetUserId", void 0);
class NotificationQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "limit", void 0);
class CreateSmsTemplateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSmsTemplateDto.prototype, "isActive", void 0);
class UpdateSmsTemplateDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSmsTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSmsTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSmsTemplateDto.prototype, "isActive", void 0);
class SendSmsDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], SendSmsDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSmsDto.prototype, "templateKey", void 0);
class SmsLogQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmsLogQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmsLogQueryDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmsLogQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmsLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmsLogQueryDto.prototype, "limit", void 0);
let AdminNotificationController = class AdminNotificationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Notifications ──
    async listNotifications(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.type && query.type !== 'all')
            where.type = query.type;
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { title: { contains: value, mode: 'insensitive' } },
                { message: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    async sendNotification(auth, dto) {
        verifyAdmin(auth);
        let targetCount = 0;
        const audience = dto.targetAudience ?? 'all';
        if (dto.targetUserId) {
            targetCount = 1;
        }
        else if (audience === 'all') {
            targetCount = await this.prisma.user.count({ where: { status: 'active' } });
        }
        else if (audience === 'doctors') {
            targetCount = await this.prisma.doctorProfile.count({ where: { isActive: true } });
        }
        else if (audience === 'radiologists') {
            targetCount = await this.prisma.user.count({ where: { role: 'radiologist', status: 'active' } });
        }
        const notification = await this.prisma.notification.create({
            data: {
                title: dto.title,
                message: dto.message,
                type: dto.type ?? 'general',
                targetAudience: audience,
                targetUserId: dto.targetUserId,
                channels: ['in_app'],
                status: 'sent',
                sentCount: targetCount,
                sentAt: new Date(),
            },
        });
        return { notification, recipients: targetCount };
    }
    async deleteNotification(auth, id) {
        verifyAdmin(auth);
        const notification = await this.prisma.notification.findUnique({ where: { id } });
        if (!notification)
            throw new common_1.NotFoundException('اعلان یافت نشد');
        await this.prisma.notification.delete({ where: { id } });
        return { ok: true };
    }
    // ── SMS Templates ──
    async listSmsTemplates(auth) {
        verifyAdmin(auth);
        return this.prisma.smsTemplate.findMany({
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async createSmsTemplate(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.smsTemplate.findUnique({ where: { key: dto.key } });
        if (existing)
            throw new common_1.BadRequestException('این کلید قالب قبلاً ثبت شده است');
        return this.prisma.smsTemplate.create({
            data: {
                key: dto.key,
                title: dto.title,
                body: dto.body,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateSmsTemplate(auth, id, dto) {
        verifyAdmin(auth);
        const template = await this.prisma.smsTemplate.findUnique({ where: { id } });
        if (!template)
            throw new common_1.NotFoundException('قالب پیامک یافت نشد');
        return this.prisma.smsTemplate.update({
            where: { id },
            data: dto,
        });
    }
    async deleteSmsTemplate(auth, id) {
        verifyAdmin(auth);
        const template = await this.prisma.smsTemplate.findUnique({ where: { id } });
        if (!template)
            throw new common_1.NotFoundException('قالب پیامک یافت نشد');
        await this.prisma.smsTemplate.delete({ where: { id } });
        return { ok: true };
    }
    // ── SMS Sending & Logs ──
    async sendSms(auth, dto) {
        verifyAdmin(auth);
        const log = await this.prisma.smsLog.create({
            data: {
                phoneNumber: dto.phoneNumber,
                message: dto.message,
                templateKey: dto.templateKey ?? null,
                status: 'sent',
                provider: 'internal',
                sentAt: new Date(),
            },
        });
        return { ok: true, logId: log.id };
    }
    async listSmsLogs(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.phoneNumber)
            where.phoneNumber = { contains: query.phoneNumber };
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { phoneNumber: { contains: value, mode: 'insensitive' } },
                { message: { contains: value, mode: 'insensitive' } },
                { templateKey: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.smsLog.count({ where }),
            this.prisma.smsLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
};
exports.AdminNotificationController = AdminNotificationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, NotificationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "listNotifications", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendNotificationDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Get)('sms-templates'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "listSmsTemplates", null);
__decorate([
    (0, common_1.Post)('sms-templates'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateSmsTemplateDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "createSmsTemplate", null);
__decorate([
    (0, common_1.Patch)('sms-templates/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateSmsTemplateDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "updateSmsTemplate", null);
__decorate([
    (0, common_1.Delete)('sms-templates/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "deleteSmsTemplate", null);
__decorate([
    (0, common_1.Post)('sms/send'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendSmsDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "sendSms", null);
__decorate([
    (0, common_1.Get)('sms-logs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SmsLogQueryDto]),
    __metadata("design:returntype", Promise)
], AdminNotificationController.prototype, "listSmsLogs", null);
exports.AdminNotificationController = AdminNotificationController = __decorate([
    (0, common_1.Controller)('admin/notifications'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminNotificationController);
