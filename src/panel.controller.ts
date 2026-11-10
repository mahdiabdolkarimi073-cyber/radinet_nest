import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

type UserIdentity = { id: string; email: string; role: string; name?: string };

function verifyUserToken(auth?: string): UserIdentity {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
    const role = (payload.role || '').toLowerCase();
    if (role !== 'user' && role !== 'patient') {
      throw new UnauthorizedException('دسترسی فقط برای بیماران و کاربران عادی مجاز است');
    }
    return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class CreateTicketDto {
  @IsString() @MinLength(3) @MaxLength(200) subject!: string;
  @IsString() @MinLength(1) message!: string;
  @IsOptional() @IsIn(['general', 'technical', 'billing', 'telereport', 'shop']) category?: string;
  @IsOptional() @IsIn(['low', 'medium', 'high', 'urgent']) priority?: string;
}

class ReplyTicketDto {
  @IsString() @MinLength(1) message!: string;
}

class CreateReviewDto {
  @IsString() targetType!: string;
  @IsString() targetId!: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() @MinLength(1) @MaxLength(2000) content!: string;
}

interface InfoRequestMessageItem {
  id: string;
  senderRole: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
  [key: string]: Prisma.InputJsonValue | undefined;
}

@Controller('panel')
export class PanelController {
  constructor(private readonly prisma: PrismaService) {}

  // ── 3. Shop Orders ──

  @Get('orders')
  async orders(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const orders = await this.prisma.shopOrder.findMany({
      where: {
        OR: [{ userId: identity.id }, { customerEmail: identity.email }],
      },
      orderBy: { createdAt: 'desc' },
      include: { items: { select: { id: true, productName: true, quantity: true, unitPrice: true, lineTotal: true } } },
    });
    return { items: orders };
  }

  @Get('orders/:id')
  async orderDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const order = await this.prisma.shopOrder.findFirst({
      where: {
        id,
        OR: [{ userId: identity.id }, { customerEmail: identity.email }],
      },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  // ── 4. Telereport Requests ──

  @Get('telereports')
  async telereports(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const items = await this.prisma.teleReportRequest.findMany({
      where: {
        OR: [{ userId: identity.id }, { phone: identity.email }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: { select: { id: true, originalName: true, storedName: true, mimeType: true, size: true } },
        reports: {
          select: { id: true, status: true, findings: true, conclusion: true, signed: true, signatureName: true, createdAt: true, author: { select: { id: true, fullName: true } } },
        },
        infoRequests: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, fullName: true } } },
        },
      },
    });
    return {
      items: items.map((req) => {
        const approvedReports = req.reports.filter((r) => r.status === 'approved' || r.status === 'final');
        const hasPendingApprovalReport = req.reports.some((r) => r.status === 'pending_approval');
        return {
          ...req,
          hasPendingApprovalReport,
          reports: approvedReports,
        };
      }),
    };
  }

  @Get('telereports/:id')
  async telereportDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const item = await this.prisma.teleReportRequest.findFirst({
      where: {
        id,
        OR: [{ userId: identity.id }, { phone: identity.email }],
      },
      include: {
        attachments: true,
        reports: {
          where: { status: { in: ['approved', 'final'] } },
          include: { images: true, author: { select: { id: true, fullName: true } } },
        },
        infoRequests: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('درخواست یافت نشد');
    return item;
  }

  @Post('telereports/:id')
  async replyTelereportInfo(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { infoRequestId?: string; message: string },
  ) {
    const identity = verifyUserToken(auth);
    const message = body.message?.trim();
    if (!message) throw new BadRequestException('متن پیام الزامی است');

    const targetInfoRequestId = body.infoRequestId || id;
    const infoRequest = await this.prisma.infoRequest.findFirst({
      where: {
        id: targetInfoRequestId,
        request: {
          OR: [{ userId: identity.id }, { phone: identity.email }],
        },
      },
    });

    if (!infoRequest) throw new NotFoundException('درخواست اطلاعات تکمیلی یافت نشد');

    const existingMessages: Prisma.InputJsonValue[] = Array.isArray(infoRequest.messages)
      ? (infoRequest.messages as Prisma.InputJsonValue[])
      : [];

    const newMsg: InfoRequestMessageItem = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderRole: 'patient',
      senderId: identity.id,
      senderName: identity.name || 'بیمار',
      message,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages: Prisma.InputJsonValue[] = [...existingMessages, newMsg];

    const updated = await this.prisma.infoRequest.update({
      where: { id: infoRequest.id },
      data: {
        messages: updatedMessages,
        response: message,
        respondedAt: new Date(),
        status: 'responded',
      },
    });

    return updated;
  }

  // ── 5. Medical Reports ──

  @Get('medical-reports')
  async medicalReports(@Headers('authorization') auth: string, @Query('search') search?: string) {
    const identity = verifyUserToken(auth);
    const where: Prisma.MedicalReportWhereInput = { userId: identity.id };
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { type: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.medicalReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  @Get('medical-reports/:id')
  async medicalReportDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const item = await this.prisma.medicalReport.findFirst({
      where: { id, userId: identity.id },
    });
    if (!item) throw new NotFoundException('گزارش یافت نشد');
    return item;
  }

  // ── 6. Transactions & Payments ──

  @Get('transactions')
  async transactions(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const items = await this.prisma.userTransaction.findMany({
      where: { userId: identity.id },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  @Get('transactions/:id')
  async transactionDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const item = await this.prisma.userTransaction.findFirst({
      where: { id, userId: identity.id },
    });
    if (!item) throw new NotFoundException('تراکنش یافت نشد');
    return item;
  }

  // ── 7. Notifications ──

  @Get('notifications')
  async notifications(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const items = await this.prisma.userNotification.findMany({
      where: { userId: identity.id },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = items.filter((n) => !n.isRead).length;
    return { items, unreadCount };
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const notif = await this.prisma.userNotification.findFirst({
      where: { id, userId: identity.id },
    });
    if (!notif) throw new NotFoundException('اعلان یافت نشد');
    return this.prisma.userNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    await this.prisma.userNotification.updateMany({
      where: { userId: identity.id, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  // ── 8. Support Tickets ──

  @Get('tickets')
  async tickets(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const items = await this.prisma.ticket.findMany({
      where: { userId: identity.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { replies: true } },
        expert: { select: { id: true, fullName: true } },
      },
    });
    return { items };
  }

  @Post('tickets')
  async createTicket(@Headers('authorization') auth: string, @Body() dto: CreateTicketDto) {
    const identity = verifyUserToken(auth);
    const ticket = await this.prisma.ticket.create({
      data: {
        subject: dto.subject,
        message: dto.message,
        category: dto.category ?? 'general',
        priority: dto.priority ?? 'medium',
        status: 'open',
        userId: identity.id,
      },
    });
    return ticket;
  }

  @Get('tickets/:id')
  async ticketDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const identity = verifyUserToken(auth);
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, userId: identity.id },
      include: {
        replies: {
          include: { author: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        expert: { select: { id: true, fullName: true } },
      },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    return ticket;
  }

  @Post('tickets/:id/reply')
  async replyTicket(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    const identity = verifyUserToken(auth);
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, userId: identity.id },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    if (ticket.status === 'closed') {
      throw new BadRequestException('این تیکت بسته شده است');
    }
    const [reply] = await this.prisma.$transaction([
      this.prisma.ticketReply.create({
        data: { ticketId: id, authorId: identity.id, message: dto.message },
        include: { author: { select: { id: true, fullName: true, role: true } } },
      }),
      this.prisma.ticket.update({
        where: { id },
        data: { status: 'open' },
      }),
    ]);
    return reply;
  }

  // ── 9. Reviews & Feedback ──

  @Get('reviews')
  async reviews(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const items = await this.prisma.review.findMany({
      where: { userId: identity.id },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  @Post('reviews')
  async createReview(@Headers('authorization') auth: string, @Body() dto: CreateReviewDto) {
    const identity = verifyUserToken(auth);
    const review = await this.prisma.review.create({
      data: {
        userId: identity.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        rating: dto.rating,
        content: dto.content,
        status: 'pending',
      },
    });
    return review;
  }
}
