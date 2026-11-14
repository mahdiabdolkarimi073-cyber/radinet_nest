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
exports.PublicTicketController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
class CreatePublicTicketDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "userPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "userEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['general', 'telereport', 'finance', 'technical', 'account']),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high', 'urgent']),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicTicketDto.prototype, "userId", void 0);
class PublicReplyDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], PublicReplyDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicReplyDto.prototype, "authorName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicReplyDto.prototype, "authorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicReplyDto.prototype, "authorRole", void 0);
let PublicTicketController = class PublicTicketController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTicket(dto) {
        const trackingCode = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const isUuid = (val) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const validUserId = isUuid(dto.userId) ? dto.userId : undefined;
        const ticket = await this.prisma.ticket.create({
            data: {
                trackingCode,
                subject: dto.subject.trim(),
                message: dto.message.trim(),
                category: dto.category || 'general',
                priority: dto.priority || 'medium',
                userName: dto.userName.trim(),
                userPhone: dto.userPhone.trim(),
                userEmail: dto.userEmail?.trim() || '',
                userId: validUserId,
                status: 'open',
            },
        });
        return {
            ok: true,
            id: ticket.id,
            tracking_code: ticket.trackingCode,
            subject: ticket.subject,
            status: ticket.status,
            message: `تیکت شما با کد پیگیری ${ticket.trackingCode} با موفقیت ثبت شد.`,
        };
    }
    async trackTicket(code) {
        const cleanCode = code.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
        const ticket = await this.prisma.ticket.findFirst({
            where: isUuid
                ? { OR: [{ id: cleanCode }, { trackingCode: cleanCode }] }
                : { trackingCode: cleanCode },
            include: {
                replies: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('تیکتی با این مشخصات یافت نشد');
        }
        return {
            id: ticket.id,
            tracking_code: ticket.trackingCode,
            subject: ticket.subject,
            message: ticket.message,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            user_name: ticket.userName,
            user_phone: ticket.userPhone,
            user_email: ticket.userEmail,
            created_at: ticket.createdAt.toISOString(),
            updated_at: ticket.updatedAt.toISOString(),
            replies: ticket.replies.map((r) => ({
                id: r.id,
                ticket_id: r.ticketId,
                author_id: r.authorId,
                author_name: r.authorName || 'کاربر',
                author_role: r.authorRole || 'user',
                message: r.message,
                created_at: r.createdAt.toISOString(),
            })),
        };
    }
    async replyToTrackedTicket(code, dto) {
        const cleanCode = code.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
        const ticket = await this.prisma.ticket.findFirst({
            where: isUuid
                ? { OR: [{ id: cleanCode }, { trackingCode: cleanCode }] }
                : { trackingCode: cleanCode },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('تیکت یافت نشد');
        }
        const isAuthorUuid = (val) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const reply = await this.prisma.ticketReply.create({
            data: {
                ticketId: ticket.id,
                message: dto.message.trim(),
                authorName: dto.authorName || ticket.userName || 'کاربر',
                authorRole: dto.authorRole || 'user',
                authorId: isAuthorUuid(dto.authorId) ? dto.authorId : undefined,
            },
        });
        await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'pending', updatedAt: new Date() },
        });
        return {
            id: reply.id,
            ticket_id: reply.ticketId,
            author_name: reply.authorName,
            author_role: reply.authorRole,
            message: reply.message,
            created_at: reply.createdAt.toISOString(),
        };
    }
};
exports.PublicTicketController = PublicTicketController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePublicTicketDto]),
    __metadata("design:returntype", Promise)
], PublicTicketController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('track/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicTicketController.prototype, "trackTicket", null);
__decorate([
    (0, common_1.Post)('track/:code/reply'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PublicReplyDto]),
    __metadata("design:returntype", Promise)
], PublicTicketController.prototype, "replyToTrackedTicket", null);
exports.PublicTicketController = PublicTicketController = __decorate([
    (0, common_1.Controller)('public-tickets'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicTicketController);
