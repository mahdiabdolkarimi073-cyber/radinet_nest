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
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
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

class CreateRoutingRuleDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() imagingType?: string;
  @IsOptional() @IsString() urgency?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxWorkload?: number;
  @IsOptional() @IsString() preferredDoctorId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateRoutingRuleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() imagingType?: string;
  @IsOptional() @IsString() urgency?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxWorkload?: number;
  @IsOptional() @IsString() preferredDoctorId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class RoutingLogQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() assignedDoctorId?: string;
  @IsOptional() @IsString() success?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('admin/routing')
export class AdminRoutingController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Routing Rules ──

  @Get('rules')
  async listRules(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.routingRule.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Get('rules/:id')
  async getRule(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const rule = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('قانون مسیریابی یافت نشد');
    return rule;
  }

  @Post('rules')
  async createRule(@Headers('authorization') auth: string, @Body() dto: CreateRoutingRuleDto) {
    verifyAdmin(auth);

    if (dto.preferredDoctorId) {
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { id: dto.preferredDoctorId },
      });
      if (!doctor) throw new BadRequestException('پزشک انتخاب‌شده یافت نشد');
    }

    return this.prisma.routingRule.create({
      data: {
        name: dto.name,
        priority: dto.priority ?? 0,
        specialty: dto.specialty ?? '',
        imagingType: dto.imagingType ?? '',
        urgency: dto.urgency ?? 'normal',
        maxWorkload: dto.maxWorkload ?? 10,
        preferredDoctorId: dto.preferredDoctorId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch('rules/:id')
  async updateRule(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoutingRuleDto,
  ) {
    verifyAdmin(auth);
    const rule = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('قانون مسیریابی یافت نشد');

    if (dto.preferredDoctorId) {
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { id: dto.preferredDoctorId },
      });
      if (!doctor) throw new BadRequestException('پزشک انتخاب‌شده یافت نشد');
    }

    return this.prisma.routingRule.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('rules/:id')
  async deleteRule(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const rule = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('قانون مسیریابی یافت نشد');

    await this.prisma.routingRule.delete({ where: { id } });
    return { ok: true };
  }

  // ── Routing Logs ──

  @Get('logs')
  async listLogs(@Headers('authorization') auth: string, @Query() query: RoutingLogQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.RoutingLogWhereInput = {};
    if (query.assignedDoctorId && query.assignedDoctorId !== 'all') {
      where.assignedDoctorId = query.assignedDoctorId;
    }
    if (query.success === 'true') where.success = true;
    else if (query.success === 'false') where.success = false;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { algorithm: { contains: value, mode: 'insensitive' } },
        { reason: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.routingLog.count({ where }),
      this.prisma.routingLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
  }

  // ── Routing Performance Stats ──

  @Get('stats')
  async getRoutingStats(@Headers('authorization') auth: string) {
    verifyAdmin(auth);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLogs, successCount, failedCount, todayCount, weekCount, monthCount, avgProcessingTime] = await Promise.all([
      this.prisma.routingLog.count(),
      this.prisma.routingLog.count({ where: { success: true } }),
      this.prisma.routingLog.count({ where: { success: false } }),
      this.prisma.routingLog.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.routingLog.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.routingLog.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.routingLog.aggregate({ _avg: { processingTimeMs: true } }),
    ]);

    const activeRules = await this.prisma.routingRule.count({ where: { isActive: true } });
    const totalRules = await this.prisma.routingRule.count();

    return {
      totalLogs,
      successRate: totalLogs > 0 ? Math.round((successCount / totalLogs) * 10000) / 100 : 0,
      successCount,
      failedCount,
      todayCount,
      weekCount,
      monthCount,
      avgProcessingTimeMs: avgProcessingTime._avg.processingTimeMs ?? 0,
      rules: { active: activeRules, total: totalRules },
    };
  }
}
