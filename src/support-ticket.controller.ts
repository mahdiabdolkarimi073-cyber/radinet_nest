import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class TicketQueryDto {
  @IsOptional() @IsIn(['open', 'pending', 'closed']) status?: string;
  @IsOptional() @IsIn(['low', 'medium', 'high', 'urgent']) priority?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}
class ReplyDto { @IsString() @MinLength(1) message!: string; }
class AssignDto { @IsString() expertId!: string; }

@Controller('support/tickets')
@UseGuards(SupportExpertGuard)
export class SupportTicketController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Headers('authorization') auth: string, @Query() query: TicketQueryDto) {
    verifySupportToken(auth);
    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
    const where: Prisma.TicketWhereInput = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.priority && query.priority !== 'all') where.priority = query.priority;
    if (query.search?.trim()) where.OR = [
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

  @Get('priority')
  async priority(@Headers('authorization') auth: string, @Query() query: TicketQueryDto) {
    verifySupportToken(auth);
    return this.list(auth, { ...query, priority: query.priority ?? 'urgent' });
  }

  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } }, expert: { select: { id: true, fullName: true, email: true } }, replies: { include: { author: { select: { id: true, fullName: true, role: true } } }, orderBy: { createdAt: 'asc' } } } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    return ticket;
  }

  @Post(':id/reply')
  async reply(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: ReplyDto) {
    const identity = verifySupportToken(auth);
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    const [reply] = await this.prisma.$transaction([
      this.prisma.ticketReply.create({
        data: { ticketId: id, authorId: identity.id, message: dto.message },
        include: { author: { select: { id: true, fullName: true, role: true } } },
      }),
      this.prisma.ticket.update({ where: { id }, data: { status: 'pending' } }),
    ]);
    return reply;
  }

  @Patch(':id/close')
  async close(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    return this.prisma.ticket.update({ where: { id }, data: { status: 'closed' } });
  }

  @Patch(':id/assign')
  async assign(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: AssignDto) {
    verifySupportToken(auth);
    const [ticket, expert] = await Promise.all([
      this.prisma.ticket.findUnique({ where: { id } }),
      this.prisma.user.findFirst({ where: { id: dto.expertId, role: { in: ['SUPPORT_EXPERT', 'support_expert'] }, status: 'active' } }),
    ]);
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    if (!expert) throw new BadRequestException('کارشناس پشتیبانی یافت نشد');
    return this.prisma.ticket.update({ where: { id }, data: { assignedTo: expert.id, status: 'pending' }, include: { expert: { select: { id: true, fullName: true } } } });
  }

  @Delete(':id')
  async delete(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    await this.prisma.ticket.delete({ where: { id } });
    return { ok: true, message: 'تیکت با موفقیت حذف شد' };
  }
}
