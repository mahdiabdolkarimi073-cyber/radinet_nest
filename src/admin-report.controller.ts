import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import * as jwt from 'jsonwebtoken';
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

class ReportQueryDto {
  @IsOptional() @IsIn(['daily', 'monthly', 'yearly']) period?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}

@Controller('admin/reports')
export class AdminReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('sales')
  async salesReport(@Headers('authorization') auth: string, @Query() query: ReportQueryDto) {
    verifyAdmin(auth);

    const period = query.period ?? 'monthly';
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const orders = await this.prisma.shopOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, orderNumber: true, total: true, status: true, paymentStatus: true, createdAt: true },
    });

    const requests = await this.prisma.teleReportRequest.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, requestNumber: true, imagingType: true, status: true, createdAt: true },
    });

    const groups = this.groupByPeriod(orders, 'createdAt', period);
    const requestGroups = this.groupByPeriod(requests, 'createdAt', period);

    const salesData = groups.map((g) => ({
      label: g.label,
      orderCount: g.items.length,
      revenue: g.items.reduce((sum, o) => sum + Number(o.total), 0),
      paidRevenue: g.items
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0),
    }));

    const requestData = requestGroups.map((g) => ({
      label: g.label,
      requestCount: g.items.length,
      completedCount: g.items.filter((r) => r.status === 'completed').length,
    }));

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const paidRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      period,
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalOrders: orders.length,
        totalRequests: requests.length,
        totalRevenue,
        paidRevenue,
      },
      sales: salesData,
      requests: requestData,
      rawOrders: orders,
      rawRequests: requests,
    };
  }

  @Get('doctors')
  async doctorPerformanceReport(@Headers('authorization') auth: string) {
    verifyAdmin(auth);

    const doctors = await this.prisma.doctorProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        specialty: true,
        userId: true,
        maxDailyReports: true,
        tariff: true,
      },
    });

    const report = await Promise.all(
      doctors.map(async (doc) => {
        const [totalReports, signedReports, completedReports, pendingReports] = await Promise.all([
          this.prisma.radiologyReport.count({ where: { authorId: doc.userId } }),
          this.prisma.radiologyReport.count({ where: { authorId: doc.userId, signed: true } }),
          this.prisma.radiologyReport.count({ where: { authorId: doc.userId, status: 'final' } }),
          this.prisma.radiologyReport.count({ where: { authorId: doc.userId, status: 'draft' } }),
        ]);

        return {
          doctorId: doc.id,
          fullName: doc.fullName,
          specialty: doc.specialty,
          maxDailyReports: doc.maxDailyReports,
          tariff: doc.tariff,
          stats: {
            totalReports,
            signedReports,
            completedReports,
            pendingReports,
            signRate: totalReports > 0 ? Math.round((signedReports / totalReports) * 10000) / 100 : 0,
          },
        };
      }),
    );

    return { items: report, total: report.length };
  }

  @Get('tele-reports')
  async teleReportSummary(@Headers('authorization') auth: string, @Query() query: ReportQueryDto) {
    verifyAdmin(auth);

    const period = query.period ?? 'monthly';
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const requests = await this.prisma.teleReportRequest.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        requestNumber: true,
        imagingType: true,
        imagingArea: true,
        status: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const groups = this.groupByPeriod(requests, 'createdAt', period);

    const byPeriod = groups.map((g) => ({
      label: g.label,
      total: g.items.length,
      new: g.items.filter((r) => r.status === 'new').length,
      assigned: g.items.filter((r) => r.status === 'assigned').length,
      completed: g.items.filter((r) => r.status === 'completed').length,
    }));

    const byImagingType: Record<string, number> = {};
    for (const r of requests) {
      byImagingType[r.imagingType] = (byImagingType[r.imagingType] ?? 0) + 1;
    }

    const byCountry: Record<string, number> = {};
    for (const r of requests) {
      byCountry[r.country] = (byCountry[r.country] ?? 0) + 1;
    }

    return {
      period,
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        total: requests.length,
        byStatus: {
          new: requests.filter((r) => r.status === 'new').length,
          assigned: requests.filter((r) => r.status === 'assigned').length,
          completed: requests.filter((r) => r.status === 'completed').length,
        },
      },
      byPeriod,
      byImagingType,
      byCountry,
    };
  }

  @Get('shop-orders')
  async shopOrderReport(@Headers('authorization') auth: string, @Query() query: ReportQueryDto) {
    verifyAdmin(auth);

    const period = query.period ?? 'monthly';
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const orders = await this.prisma.shopOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
      include: { items: true },
    });

    const groups = this.groupByPeriod(orders, 'createdAt', period);

    const byPeriod = groups.map((g) => ({
      label: g.label,
      totalOrders: g.items.length,
      revenue: g.items.reduce((sum, o) => sum + Number(o.total), 0),
      paidRevenue: g.items
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0),
      byStatus: {
        pending: g.items.filter((o) => o.status === 'pending').length,
        processing: g.items.filter((o) => o.status === 'processing').length,
        shipped: g.items.filter((o) => o.status === 'shipped').length,
        delivered: g.items.filter((o) => o.status === 'delivered').length,
        cancelled: g.items.filter((o) => o.status === 'cancelled').length,
      },
    }));

    const topProducts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        if (!topProducts[key]) {
          topProducts[key] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        topProducts[key].quantity += item.quantity;
        topProducts[key].revenue += Number(item.lineTotal);
      }
    }

    const topProductsList = Object.entries(topProducts)
      .map(([id, v]) => ({ productId: id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return {
      period,
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        paidRevenue: orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + Number(o.total), 0),
      },
      byPeriod,
      topProducts: topProductsList,
    };
  }

  private groupByPeriod<T extends Record<string, unknown>>(
    items: T[],
    dateField: keyof T,
    period: string,
  ): { label: string; items: T[] }[] {
    const groups: Record<string, { label: string; items: T[] }> = {};

    for (const item of items) {
      const dateValue = item[dateField] as unknown as Date;
      if (!dateValue) continue;
      const date = new Date(dateValue);

      let label: string;
      if (period === 'daily') {
        label = date.toISOString().slice(0, 10);
      } else if (period === 'monthly') {
        label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        label = String(date.getFullYear());
      }

      if (!groups[label]) groups[label] = { label, items: [] };
      groups[label].items.push(item);
    }

    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }
}
