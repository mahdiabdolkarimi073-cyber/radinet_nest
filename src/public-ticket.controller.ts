import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma.service';

class CreatePublicTicketDto {
  @IsString() @MinLength(3) subject!: string;
  @IsString() @MinLength(5) message!: string;
  @IsString() @MinLength(2) userName!: string;
  @IsString() @MinLength(7) userPhone!: string;
  @IsOptional() @IsString() userEmail?: string;
  @IsOptional() @IsIn(['general', 'telereport', 'finance', 'technical', 'account']) category?: string;
  @IsOptional() @IsIn(['low', 'medium', 'high', 'urgent']) priority?: string;
  @IsOptional() @IsString() userId?: string;
}

class PublicReplyDto {
  @IsString() @MinLength(1) message!: string;
  @IsOptional() @IsString() authorName?: string;
  @IsOptional() @IsString() authorId?: string;
  @IsOptional() @IsString() authorRole?: string;
}

@Controller('public-tickets')
export class PublicTicketController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createTicket(@Body() dto: CreatePublicTicketDto) {
    const trackingCode = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isUuid = (val?: string) =>
      val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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

  @Get('track/:code')
  async trackTicket(@Param('code') code: string) {
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
      throw new NotFoundException('تیکتی با این مشخصات یافت نشد');
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
      replies: ticket.replies.map((r: any) => ({
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

  @Post('track/:code/reply')
  async replyToTrackedTicket(@Param('code') code: string, @Body() dto: PublicReplyDto) {
    const cleanCode = code.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);

    const ticket = await this.prisma.ticket.findFirst({
      where: isUuid
        ? { OR: [{ id: cleanCode }, { trackingCode: cleanCode }] }
        : { trackingCode: cleanCode },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }

    const isAuthorUuid = (val?: string) =>
      val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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
}
