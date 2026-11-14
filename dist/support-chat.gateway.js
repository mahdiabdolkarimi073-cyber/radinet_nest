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
exports.SupportChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
let SupportChatGateway = class SupportChatGateway {
    constructor(prisma) {
        this.prisma = prisma;
    }
    handleConnection(socket) {
        try {
            (0, support_auth_1.verifySocketSupport)(socket);
        }
        catch {
            socket.disconnect(true);
        }
    }
    async joinRoom(socket, roomId) {
        const identity = (0, support_auth_1.verifySocketSupport)(socket);
        const chat = await this.prisma.chatSession.findUnique({ where: { id: roomId } });
        if (!chat)
            return { ok: false, error: 'گفتگو یافت نشد' };
        await socket.join(roomId);
        if (!chat.expertId)
            await this.prisma.chatSession.update({ where: { id: roomId }, data: { expertId: identity.id, status: 'active' } });
        return { ok: true, roomId };
    }
    async sendMessage(socket, data) {
        const identity = (0, support_auth_1.verifySocketSupport)(socket);
        if (!data.roomId || !data.content?.trim())
            return { ok: false, error: 'اطلاعات پیام ناقص است' };
        const chat = await this.prisma.chatSession.findUnique({ where: { id: data.roomId } });
        if (!chat)
            return { ok: false, error: 'گفتگو یافت نشد' };
        const message = await this.prisma.chatMessage.create({ data: { sessionId: data.roomId, senderId: identity.id, senderRole: identity.role, content: data.content.trim() }, include: { sender: { select: { id: true, fullName: true, role: true } } } });
        this.server.to(data.roomId).emit('newMessage', message);
        return { ok: true, message };
    }
    async typing(socket, roomId) {
        (0, support_auth_1.verifySocketSupport)(socket);
        socket.to(roomId).emit('typing', { roomId });
        return { ok: true };
    }
    async closeChat(socket, roomId) {
        (0, support_auth_1.verifySocketSupport)(socket);
        const chat = await this.prisma.chatSession.findUnique({ where: { id: roomId } });
        if (!chat)
            return { ok: false, error: 'گفتگو یافت نشد' };
        const updated = await this.prisma.chatSession.update({ where: { id: roomId }, data: { status: 'closed' } });
        this.server.to(roomId).emit('chatClosed', { roomId });
        return { ok: true, chat: updated };
    }
};
exports.SupportChatGateway = SupportChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SupportChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], SupportChatGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SupportChatGateway.prototype, "sendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], SupportChatGateway.prototype, "typing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('closeChat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], SupportChatGateway.prototype, "closeChat", null);
exports.SupportChatGateway = SupportChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/support-chat', cors: { origin: true, credentials: true } }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportChatGateway);
