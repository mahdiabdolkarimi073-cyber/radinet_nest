import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const statusLabels: Record<string, string> = {
  new: 'درخواست جدید',
  pending: 'در انتظار بررسی',
  in_progress: 'در حال بررسی',
  reviewing: 'در حال بررسی',
  completed: 'درخواست تکمیل شد',
  referred: 'درخواست ارجاع شد',
  rejected: 'درخواست رد شد',
};

const statusColors: Record<string, string> = {
  new: 'warning',
  pending: 'warning',
  in_progress: 'info',
  reviewing: 'info',
  completed: 'success',
  referred: 'success',
  rejected: 'error',
};

class UpdateReferralStatusDto {
  @IsString()
  @IsIn(['new', 'in_progress', 'completed', 'rejected'])
  status!: string;
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDashboard() {
    const requests = await this.prisma.teleReportRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        requestNumber: true,
        patientFirstName: true,
        patientLastName: true,
        imagingType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const counts = requests.reduce(
      (result, request) => {
        const status = request.status.toLowerCase();
        result.total += 1;
        if (status === 'new' || status === 'pending') result.new += 1;
        if (status === 'in_progress' || status === 'reviewing' || status === 'referred') result.inReview += 1;
        if (status === 'completed') result.completed += 1;
        return result;
      },
      { total: 0, new: 0, inReview: 0, completed: 0 },
    );

    const notifications = requests.slice(0, 5).map((request) => ({
      id: request.id,
      title: `${statusLabels[request.status.toLowerCase()] ?? 'به‌روزرسانی درخواست'} ${request.requestNumber}`,
      description: `${request.patientFirstName} ${request.patientLastName} · ${request.imagingType}`,
      status: statusColors[request.status.toLowerCase()] ?? 'info',
      createdAt: request.updatedAt ?? request.createdAt,
    }));

    return { stats: counts, notifications };
  }

  @Get('referrals')
  async listReferrals(
    @Query('status') status?: string,
    @Query('imagingType') imagingType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
    const where: Prisma.TeleReportRequestWhereInput = {};

    if (status && status !== 'all') where.status = status;
    if (imagingType && imagingType !== 'all') where.imagingType = imagingType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (search?.trim()) {
      const value = search.trim();
      where.OR = [
        { requestNumber: { contains: value, mode: 'insensitive' } },
        { patientFirstName: { contains: value, mode: 'insensitive' } },
        { patientLastName: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.teleReportRequest.count({ where }),
      this.prisma.teleReportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          imagingType: true,
          imagingArea: true,
          studyDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          country: true,
          city: true,
        },
      }),
    ]);

    return {
      items: requests,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Patch('referrals/:id/status')
  async updateReferralStatus(@Param('id') id: string, @Body() body: UpdateReferralStatusDto) {
    return this.prisma.teleReportRequest.update({
      where: { id },
      data: { status: body.status },
      select: {
        id: true,
        requestNumber: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  @Get('finance')
  getFinanceSummary() {
    return {
      totalIncome: 0,
      settleableIncome: 0,
      settledIncome: 0,
      incomeGeneratingRequestsCount: 0,
      currency: 'IRR',
      isUnderDevelopment: true,
      developmentNotice:
        'بخش مالی و درآمد پزشک در حال توسعه است. محاسبه و تسویه درآمد در نسخه فعلی فعال نیست.',
      transactions: [],
    };
  }
}

