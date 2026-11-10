import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class ChatQueryDto { @IsOptional() @IsIn(['waiting', 'active', 'closed']) status?: string; }
class ChatAssignDto { @IsString() expertId!: string; }
class ChatMessageDto { @IsString() content!: string; }

@Controller('support/chats')
@UseGuards(SupportExpertGuard)
export class SupportChatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Headers('authorization') auth: string, @Query() query: ChatQueryDto) {
    verifySupportToken(auth);
    return this.prisma.chatSession.findMany({ where: { status: query.status && query.status !== 'all' ? query.status : { in: ['waiting', 'active'] } }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } }, _count: { select: { messages: true } } }, orderBy: { updatedAt: 'desc' } });
  }

  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const chat = await this.prisma.chatSession.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true } }, messages: { include: { sender: { select: { id: true, fullName: true, role: true } } }, orderBy: { createdAt: 'asc' } } } });
    if (!chat) throw new NotFoundException('گفتگو یافت نشد');
    return chat;
  }

  @Post(':id/messages')
  async message(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: ChatMessageDto) {
    const identity = verifySupportToken(auth);
    const chat = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('گفتگو یافت نشد');
    return this.prisma.chatMessage.create({ data: { sessionId: id, senderId: identity.id, senderRole: identity.role, content: dto.content.trim() }, include: { sender: { select: { id: true, fullName: true, role: true } } } });
  }

  @Post(':id/assign')
  async assign(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: ChatAssignDto) {
    verifySupportToken(auth);
    const [chat, expert] = await Promise.all([
      this.prisma.chatSession.findUnique({ where: { id } }),
      this.prisma.user.findFirst({ where: { id: dto.expertId, role: { in: ['SUPPORT_EXPERT', 'support_expert'] }, status: 'active' } }),
    ]);
    if (!chat) throw new NotFoundException('گفتگو یافت نشد');
    if (!expert) throw new BadRequestException('کارشناس پشتیبانی یافت نشد');
    return this.prisma.chatSession.update({ where: { id }, data: { expertId: expert.id, status: 'active' }, include: { expert: { select: { id: true, fullName: true } } } });
  }
}
