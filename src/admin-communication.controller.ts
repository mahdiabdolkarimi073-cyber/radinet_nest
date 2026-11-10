import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { verifyAdminToken } from './auth-token';

class AdminCommunicationQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class UpdateCommunicationDto {
  @IsOptional() @IsString() status?: 'open' | 'answered' | 'closed';
  @IsOptional() @IsString() adminNote?: string;
  @IsOptional() @IsString() adminMessage?: string;
}

@Controller('admin/communications')
export class AdminCommunicationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listCommunications(
    @Headers('authorization') authHeader: string | undefined,
    @Query() query: AdminCommunicationQueryDto,
  ) {
    verifyAdminToken(authHeader);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.InfoRequestWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { response: { contains: q, mode: 'insensitive' } },
        { request: { requestNumber: { contains: q, mode: 'insensitive' } } },
        { request: { patientFirstName: { contains: q, mode: 'insensitive' } } },
        { request: { patientLastName: { contains: q, mode: 'insensitive' } } },
        { author: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, items, openCount, answeredCount, closedCount] = await Promise.all([
      this.prisma.infoRequest.count({ where }),
      this.prisma.infoRequest.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, fullName: true, email: true } },
          request: {
            select: {
              id: true,
              requestNumber: true,
              patientFirstName: true,
              patientLastName: true,
              phone: true,
              imagingType: true,
              imagingArea: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.infoRequest.count({ where: { status: 'open' } }),
      this.prisma.infoRequest.count({ where: { status: 'answered' } }),
      this.prisma.infoRequest.count({ where: { status: 'closed' } }),
    ]);

    return {
      items: items.map((ir) => ({
        id: ir.id,
        requestId: ir.requestId,
        requestNumber: ir.request?.requestNumber || '—',
        patientName: ir.request
          ? `${ir.request.patientFirstName} ${ir.request.patientLastName}`.trim()
          : 'بیمار',
        patientPhone: ir.request?.phone || '—',
        doctorName: ir.author?.fullName || 'پزشک رادیولوژیست',
        imagingType: ir.request?.imagingType || '—',
        imagingArea: ir.request?.imagingArea || 'عمومی',
        subject: ir.title,
        message: ir.body,
        response: ir.response,
        status: ir.status,
        adminNote: (ir as any).adminNote || null,
        messages: Array.isArray((ir as any).messages) ? (ir as any).messages : [],
        createdAt: ir.createdAt.toISOString(),
        updatedAt: ir.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      counts: {
        all: openCount + answeredCount + closedCount,
        open: openCount,
        answered: answeredCount,
        closed: closedCount,
      },
    };
  }

  @Patch(':id')
  async updateCommunication(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationDto,
  ) {
    const admin = verifyAdminToken(authHeader);

    const existing = await this.prisma.infoRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('مکالمه یا درخواست اطلاعات تکمیلی یافت نشد');

    if (dto.status && !['open', 'answered', 'closed'].includes(dto.status)) {
      throw new BadRequestException('وضعیت پیگیری نامعتبر است');
    }

    const prevMessages = Array.isArray((existing as any).messages)
      ? ([...(existing as any).messages] as any[])
      : [];
    if (dto.adminMessage?.trim()) {
      prevMessages.push({
        id: `msg-${Date.now()}`,
        senderRole: 'admin',
        senderId: admin.userId,
        senderName: 'مدیر سامانه',
        message: dto.adminMessage.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    const updated = await this.prisma.infoRequest.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote.trim() || null } : {}),
        ...(dto.adminMessage?.trim() ? { messages: prevMessages as any } : {}),
      } as any,
    });

    return updated;
  }
}
