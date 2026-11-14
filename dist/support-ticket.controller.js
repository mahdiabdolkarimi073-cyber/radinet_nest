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
exports.SupportTicketController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
class TicketQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['open', 'pending', 'closed']),
    __metadata("design:type", String)
], TicketQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high', 'urgent']),
    __metadata("design:type", String)
], TicketQueryDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TicketQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TicketQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TicketQueryDto.prototype, "limit", void 0);
class ReplyDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ReplyDto.prototype, "message", void 0);
class AssignDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDto.prototype, "expertId", void 0);
let SupportTicketController = class SupportTicketController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.priority && query.priority !== 'all')
            where.priority = query.priority;
        if (query.search?.trim())
            where.OR = [
                { subject: { contains: query.search.trim(), mode: 'insensitive' } },
                { message: { contains: query.search.trim(), mode: 'insensitive' } },
                { user: { fullName: { contains: query.search.trim(), mode: 'insensitive' } } },
            ];
        const [total, items] = await Promise.all([
            this.prisma.ticket.count({ where }),
            this.prisma.ticket.findMany({ where, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true } }, _count: { select: { replies: true } } }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        ]);
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    async priority(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        return this.list(auth, { ...query, priority: query.priority ?? 'urgent' });
    }
    async detail(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true, email: true } }, replies: { include: { author: { select: { id: true, fullName: true, role: true } } }, orderBy: { createdAt: 'asc' } } } });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        return ticket;
    }
    async reply(auth, id, dto) {
        const identity = (0, support_auth_1.verifySupportToken)(auth);
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        const [reply] = await this.prisma.$transaction([
            this.prisma.ticketReply.create({
                data: { ticketId: id, authorId: identity.id, message: dto.message },
                include: { author: { select: { id: true, fullName: true, role: true } } },
            }),
            this.prisma.ticket.update({ where: { id }, data: { status: 'pending' } }),
        ]);
        return reply;
    }
    async close(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        return this.prisma.ticket.update({ where: { id }, data: { status: 'closed' } });
    }
    async assign(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const [ticket, expert] = await Promise.all([
            this.prisma.ticket.findUnique({ where: { id } }),
            this.prisma.user.findFirst({ where: { id: dto.expertId, role: { in: ['SUPPORT_EXPERT', 'support_expert'] }, status: 'active' } }),
        ]);
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        if (!expert)
            throw new common_1.BadRequestException('کارشناس پشتیبانی یافت نشد');
        return this.prisma.ticket.update({ where: { id }, data: { assignedTo: expert.id, status: 'pending' }, include: { expert: { select: { id: true, fullName: true } } } });
    }
    async delete(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        await this.prisma.ticket.delete({ where: { id } });
        return { ok: true, message: 'تیکت با موفقیت حذف شد' };
    }
};
exports.SupportTicketController = SupportTicketController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TicketQueryDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('priority'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TicketQueryDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "priority", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':id/reply'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ReplyDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "reply", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, AssignDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "delete", null);
exports.SupportTicketController = SupportTicketController = __decorate([
    (0, common_1.Controller)('support/tickets'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportTicketController);
