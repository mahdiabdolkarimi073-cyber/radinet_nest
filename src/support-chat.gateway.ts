import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma.service';
import { verifySocketSupport } from './support-auth';

@WebSocketGateway({ namespace: '/support-chat', cors: { origin: true, credentials: true } })
@Injectable()
export class SupportChatGateway {
  @WebSocketServer() server!: Server;
  constructor(private readonly prisma: PrismaService) {}

  handleConnection(socket: Socket) {
    try { verifySocketSupport(socket); } catch { socket.disconnect(true); }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string) {
    const identity = verifySocketSupport(socket);
    const chat = await this.prisma.chatSession.findUnique({ where: { id: roomId } });
    if (!chat) return { ok: false, error: 'گفتگو یافت نشد' };
    await socket.join(roomId);
    if (!chat.expertId) await this.prisma.chatSession.update({ where: { id: roomId }, data: { expertId: identity.id, status: 'active' } });
    return { ok: true, roomId };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId?: string; content?: string }) {
    const identity = verifySocketSupport(socket);
    if (!data.roomId || !data.content?.trim()) return { ok: false, error: 'اطلاعات پیام ناقص است' };
    const chat = await this.prisma.chatSession.findUnique({ where: { id: data.roomId } });
    if (!chat) return { ok: false, error: 'گفتگو یافت نشد' };
    const message = await this.prisma.chatMessage.create({ data: { sessionId: data.roomId, senderId: identity.id, senderRole: identity.role, content: data.content.trim() }, include: { sender: { select: { id: true, fullName: true, role: true } } } });
    this.server.to(data.roomId).emit('newMessage', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing')
  async typing(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string) {
    verifySocketSupport(socket);
    socket.to(roomId).emit('typing', { roomId });
    return { ok: true };
  }

  @SubscribeMessage('closeChat')
  async closeChat(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string) {
    verifySocketSupport(socket);
    const chat = await this.prisma.chatSession.findUnique({ where: { id: roomId } });
    if (!chat) return { ok: false, error: 'گفتگو یافت نشد' };
    const updated = await this.prisma.chatSession.update({ where: { id: roomId }, data: { status: 'closed' } });
    this.server.to(roomId).emit('chatClosed', { roomId });
    return { ok: true, chat: updated };
  }
}
