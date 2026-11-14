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
exports.SupportChatController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
class ChatQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['waiting', 'active', 'closed']),
    __metadata("design:type", String)
], ChatQueryDto.prototype, "status", void 0);
class ChatAssignDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatAssignDto.prototype, "expertId", void 0);
class ChatMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "content", void 0);
let SupportChatController = class SupportChatController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        return this.prisma.chatSession.findMany({ where: { status: query.status && query.status !== 'all' ? query.status : { in: ['waiting', 'active'] } }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } }, _count: { select: { messages: true } } }, orderBy: { updatedAt: 'desc' } });
    }
    async detail(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const chat = await this.prisma.chatSession.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true } }, messages: { include: { sender: { select: { id: true, fullName: true, role: true } } }, orderBy: { createdAt: 'asc' } } } });
        if (!chat)
            throw new common_1.NotFoundException('گفتگو یافت نشد');
        return chat;
    }
    async message(auth, id, dto) {
        const identity = (0, support_auth_1.verifySupportToken)(auth);
        const chat = await this.prisma.chatSession.findUnique({ where: { id } });
        if (!chat)
            throw new common_1.NotFoundException('گفتگو یافت نشد');
        return this.prisma.chatMessage.create({ data: { sessionId: id, senderId: identity.id, senderRole: identity.role, content: dto.content.trim() }, include: { sender: { select: { id: true, fullName: true, role: true } } } });
    }
    async assign(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const [chat, expert] = await Promise.all([
            this.prisma.chatSession.findUnique({ where: { id } }),
            this.prisma.user.findFirst({ where: { id: dto.expertId, role: { in: ['SUPPORT_EXPERT', 'support_expert'] }, status: 'active' } }),
        ]);
        if (!chat)
            throw new common_1.NotFoundException('گفتگو یافت نشد');
        if (!expert)
            throw new common_1.BadRequestException('کارشناس پشتیبانی یافت نشد');
        return this.prisma.chatSession.update({ where: { id }, data: { expertId: expert.id, status: 'active' }, include: { expert: { select: { id: true, fullName: true } } } });
    }
};
exports.SupportChatController = SupportChatController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChatQueryDto]),
    __metadata("design:returntype", Promise)
], SupportChatController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportChatController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ChatMessageDto]),
    __metadata("design:returntype", Promise)
], SupportChatController.prototype, "message", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ChatAssignDto]),
    __metadata("design:returntype", Promise)
], SupportChatController.prototype, "assign", null);
exports.SupportChatController = SupportChatController = __decorate([
    (0, common_1.Controller)('support/chats'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportChatController);
