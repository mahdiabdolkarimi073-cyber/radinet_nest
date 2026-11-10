import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  private verifyAdmin(auth?: string) {
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
    const token = auth.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      if (payload.role !== 'admin') throw new UnauthorizedException('دسترسی مجاز نیست');
      return payload;
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }

  @Get()
  async getStats(@Headers('authorization') auth?: string) {
    this.verifyAdmin(auth);

    const [
      totalUsers,
      totalDoctors,
      totalRadiologists,
      totalOrders,
      totalRequests,
      totalReports,
      totalProducts,
      totalCategories,
      totalCenters,
      totalOrganizations,
      recentOrders,
      recentRequests,
      recentReports,
      recentUsers,
      recentNotifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.doctorProfile.count(),
      this.prisma.user.count({ where: { role: 'radiologist' } }),
      this.prisma.shopOrder.count(),
      this.prisma.teleReportRequest.count(),
      this.prisma.radiologyReport.count(),
      this.prisma.shopProduct.count(),
      this.prisma.shopCategory.count(),
      this.prisma.imagingCenter.count(),
      this.prisma.organization.count(),
      this.prisma.shopOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
      this.prisma.teleReportRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { requestNumber: true, patientFirstName: true, patientLastName: true, imagingType: true, status: true, createdAt: true } }),
      this.prisma.radiologyReport.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, status: true, signed: true, createdAt: true, request: { select: { requestNumber: true, patientFirstName: true, patientLastName: true } } } }),
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, fullName: true, email: true, role: true, createdAt: true } }),
      this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, message: true, type: true, status: true, createdAt: true } }),
    ]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [ordersToday, ordersThisMonth, ordersThisYear, requestsToday, requestsThisMonth, requestsThisYear] = await Promise.all([
      this.prisma.shopOrder.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.shopOrder.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.shopOrder.count({ where: { createdAt: { gte: startOfYear } } }),
      this.prisma.teleReportRequest.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.teleReportRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.teleReportRequest.count({ where: { createdAt: { gte: startOfYear } } }),
    ]);

    const shopRevenueAgg = await this.prisma.shopOrder.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { total: true },
    });

    const teleReportTxAgg = await this.prisma.userTransaction.aggregate({
      where: { type: 'telereport', status: 'paid' },
      _sum: { amount: true },
    });

    let teleReportRevenue = Number(teleReportTxAgg._sum.amount ?? 0);
    if (teleReportRevenue === 0) {
      const completedRequests = await this.prisma.teleReportRequest.findMany({
        where: { status: 'completed' },
        select: { imagingType: true },
      });
      if (completedRequests.length > 0) {
        const tariffs = await this.prisma.teleReportTariff.findMany({
          select: { imagingType: true, price: true },
        });
        const tariffMap = new Map(tariffs.map((t) => [t.imagingType.trim().toLowerCase(), Number(t.price)]));
        teleReportRevenue = completedRequests.reduce((sum, req) => {
          const typeKey = (req.imagingType || '').trim().toLowerCase();
          return sum + (tariffMap.get(typeKey) ?? 350000);
        }, 0);
      }
    }

    const dailySalesData = await this.getDailySales();
    const monthlySalesData = await this.getMonthlySales();
    const yearlySalesData = await this.getYearlySales();

    const activities = [
      ...recentOrders.map((o) => ({
        type: 'order' as const,
        title: `سفارش ${o.orderNumber}`,
        description: `${o.customerName} · ${Number(o.total).toLocaleString('fa-IR')} تومان`,
        status: o.status,
        createdAt: o.createdAt,
      })),
      ...recentRequests.map((r) => ({
        type: 'request' as const,
        title: `درخواست ${r.requestNumber}`,
        description: `${r.patientFirstName} ${r.patientLastName} · ${r.imagingType}`,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...recentReports.map((r) => ({
        type: 'report' as const,
        title: `گزارش برای ${r.request?.requestNumber ?? ''}`,
        description: `${r.request?.patientFirstName ?? ''} ${r.request?.patientLastName ?? ''} · ${r.signed ? 'امضاشده' : 'پیش‌نویس'}`,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...recentUsers.map((u) => ({
        type: 'user' as const,
        title: `کاربر جدید: ${u.fullName}`,
        description: `${u.email} · ${u.role}`,
        status: 'new',
        createdAt: u.createdAt,
      })),
      ...recentNotifications.map((n) => ({
        type: 'notification' as const,
        title: n.title,
        description: n.message.slice(0, 80),
        status: n.status,
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

    return {
      stats: {
        users: totalUsers,
        doctors: totalDoctors,
        radiologists: totalRadiologists,
        centers: totalCenters,
        organizations: totalOrganizations,
        orders: totalOrders,
        requests: totalRequests,
        reports: totalReports,
        products: totalProducts,
        categories: totalCategories,
      },
      sales: {
        daily: { orders: ordersToday, requests: requestsToday },
        monthly: { orders: ordersThisMonth, requests: requestsThisMonth },
        yearly: { orders: ordersThisYear, requests: requestsThisYear },
      },
      revenue: {
        shop: Number(shopRevenueAgg._sum.total ?? 0),
        teleReport: teleReportRevenue,
        total: Number(shopRevenueAgg._sum.total ?? 0) + teleReportRevenue,
      },
      charts: {
        daily: dailySalesData,
        monthly: monthlySalesData,
        yearly: yearlySalesData,
      },
      activities,
      notifications: recentNotifications,
    };
  }

  private async getDailySales() {
    const days: { label: string; date: Date; orders: number; requests: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const [orders, requests] = await Promise.all([
        this.prisma.shopOrder.count({ where: { createdAt: { gte: d, lt: next } } }),
        this.prisma.teleReportRequest.count({ where: { createdAt: { gte: d, lt: next } } }),
      ]);
      days.push({ label: d.toLocaleDateString('fa-IR', { weekday: 'short' }), date: d, orders, requests });
    }
    return days;
  }

  private async getMonthlySales() {
    const months: { label: string; orders: number; requests: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const [orders, requests] = await Promise.all([
        this.prisma.shopOrder.count({ where: { createdAt: { gte: m, lt: next } } }),
        this.prisma.teleReportRequest.count({ where: { createdAt: { gte: m, lt: next } } }),
      ]);
      months.push({ label: m.toLocaleDateString('fa-IR', { month: 'long' }), orders, requests });
    }
    return months;
  }

  private async getYearlySales() {
    const years: { label: string; orders: number; requests: number }[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const y = new Date(now.getFullYear() - i, 0, 1);
      const next = new Date(y.getFullYear() + 1, 0, 1);
      const [orders, requests] = await Promise.all([
        this.prisma.shopOrder.count({ where: { createdAt: { gte: y, lt: next } } }),
        this.prisma.teleReportRequest.count({ where: { createdAt: { gte: y, lt: next } } }),
      ]);
      years.push({ label: String(y.getFullYear()), orders, requests });
    }
    return years;
  }
}
