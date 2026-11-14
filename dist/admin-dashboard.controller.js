"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
let AdminDashboardController = class AdminDashboardController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    verifyAdmin(auth) {
        if (!auth?.startsWith('Bearer '))
            throw new common_1.UnauthorizedException('توکن ارسال نشده است');
        const token = auth.slice('Bearer '.length);
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            if (payload.role !== 'admin')
                throw new common_1.UnauthorizedException('دسترسی مجاز نیست');
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException('توکن نامعتبر است');
        }
    }
    async getStats(auth) {
        this.verifyAdmin(auth);
        const [totalUsers, totalDoctors, totalRadiologists, totalOrders, totalRequests, totalReports, totalProducts, totalCategories, totalCenters, totalOrganizations, recentOrders, recentRequests, recentReports, recentUsers, recentNotifications,] = await Promise.all([
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
                type: 'order',
                title: `سفارش ${o.orderNumber}`,
                description: `${o.customerName} · ${Number(o.total).toLocaleString('fa-IR')} تومان`,
                status: o.status,
                createdAt: o.createdAt,
            })),
            ...recentRequests.map((r) => ({
                type: 'request',
                title: `درخواست ${r.requestNumber}`,
                description: `${r.patientFirstName} ${r.patientLastName} · ${r.imagingType}`,
                status: r.status,
                createdAt: r.createdAt,
            })),
            ...recentReports.map((r) => ({
                type: 'report',
                title: `گزارش برای ${r.request?.requestNumber ?? ''}`,
                description: `${r.request?.patientFirstName ?? ''} ${r.request?.patientLastName ?? ''} · ${r.signed ? 'امضاشده' : 'پیش‌نویس'}`,
                status: r.status,
                createdAt: r.createdAt,
            })),
            ...recentUsers.map((u) => ({
                type: 'user',
                title: `کاربر جدید: ${u.fullName}`,
                description: `${u.email} · ${u.role}`,
                status: 'new',
                createdAt: u.createdAt,
            })),
            ...recentNotifications.map((n) => ({
                type: 'notification',
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
    async getDailySales() {
        const days = [];
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
    async getMonthlySales() {
        const months = [];
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
    async getYearlySales() {
        const years = [];
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
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getStats", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, common_1.Controller)('admin-dashboard'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDashboardController);
