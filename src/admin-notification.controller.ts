import {
  Body,
  Controller,
  Delete,
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
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function verifyAdmin(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new UnauthorizedException('دسترسی مجاز نیست');
    return payload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class SendNotificationDto {
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(2) message!: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsString() targetUserId?: string;
}

class NotificationQueryDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class CreateSmsTemplateDto {
  @IsString() @MinLength(2) key!: string;
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(2) body!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateSmsTemplateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class SendSmsDto {
  @IsString() phoneNumber!: string;
  @IsString() @MinLength(2) message!: string;
  @IsOptional() @IsString() templateKey?: string;
}

class SmsLogQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('admin/notifications')
export class AdminNotificationController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Notifications ──

  @Get()
  async listNotifications(@Headers('authorization') auth: string, @Query() query: NotificationQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.NotificationWhereInput = {};
    if (query.type && query.type !== 'all') where.type = query.type;
    if (query.status && query.status !== 'all') where.status = query.status;
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

  @Post('send')
  async sendNotification(@Headers('authorization') auth: string, @Body() dto: SendNotificationDto) {
    verifyAdmin(auth);

    let targetCount = 0;
    const audience = dto.targetAudience ?? 'all';

    if (dto.targetUserId) {
      targetCount = 1;
    } else if (audience === 'all') {
      targetCount = await this.prisma.user.count({ where: { status: 'active' } });
    } else if (audience === 'doctors') {
      targetCount = await this.prisma.doctorProfile.count({ where: { isActive: true } });
    } else if (audience === 'radiologists') {
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

  @Delete(':id')
  async deleteNotification(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('اعلان یافت نشد');

    await this.prisma.notification.delete({ where: { id } });
    return { ok: true };
  }

  // ── SMS Templates ──

  @Get('sms-templates')
  async listSmsTemplates(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.smsTemplate.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  @Post('sms-templates')
  async createSmsTemplate(@Headers('authorization') auth: string, @Body() dto: CreateSmsTemplateDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.smsTemplate.findUnique({ where: { key: dto.key } });
    if (existing) throw new BadRequestException('این کلید قالب قبلاً ثبت شده است');

    return this.prisma.smsTemplate.create({
      data: {
        key: dto.key,
        title: dto.title,
        body: dto.body,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch('sms-templates/:id')
  async updateSmsTemplate(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateSmsTemplateDto,
  ) {
    verifyAdmin(auth);
    const template = await this.prisma.smsTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('قالب پیامک یافت نشد');

    return this.prisma.smsTemplate.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('sms-templates/:id')
  async deleteSmsTemplate(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const template = await this.prisma.smsTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('قالب پیامک یافت نشد');

    await this.prisma.smsTemplate.delete({ where: { id } });
    return { ok: true };
  }

  // ── SMS Sending & Logs ──

  @Post('sms/send')
  async sendSms(@Headers('authorization') auth: string, @Body() dto: SendSmsDto) {
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

  @Get('sms-logs')
  async listSmsLogs(@Headers('authorization') auth: string, @Query() query: SmsLogQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.SmsLogWhereInput = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.phoneNumber) where.phoneNumber = { contains: query.phoneNumber };
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
}
