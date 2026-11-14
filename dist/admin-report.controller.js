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
exports.AdminReportController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function verifyAdmin(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (payload.role !== 'admin')
            throw new common_1.UnauthorizedException('دسترسی مجاز نیست');
        return payload;
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class ReportQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['daily', 'monthly', 'yearly']),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "endDate", void 0);
let AdminReportController = class AdminReportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async salesReport(auth, query) {
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
    async doctorPerformanceReport(auth) {
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
        const report = await Promise.all(doctors.map(async (doc) => {
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
        }));
        return { items: report, total: report.length };
    }
    async teleReportSummary(auth, query) {
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
        const byImagingType = {};
        for (const r of requests) {
            byImagingType[r.imagingType] = (byImagingType[r.imagingType] ?? 0) + 1;
        }
        const byCountry = {};
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
    async shopOrderReport(auth, query) {
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
        const topProducts = {};
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
    groupByPeriod(items, dateField, period) {
        const groups = {};
        for (const item of items) {
            const dateValue = item[dateField];
            if (!dateValue)
                continue;
            const date = new Date(dateValue);
            let label;
            if (period === 'daily') {
                label = date.toISOString().slice(0, 10);
            }
            else if (period === 'monthly') {
                label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            else {
                label = String(date.getFullYear());
            }
            if (!groups[label])
                groups[label] = { label, items: [] };
            groups[label].items.push(item);
        }
        return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
    }
};
exports.AdminReportController = AdminReportController;
__decorate([
    (0, common_1.Get)('sales'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReportController.prototype, "salesReport", null);
__decorate([
    (0, common_1.Get)('doctors'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminReportController.prototype, "doctorPerformanceReport", null);
__decorate([
    (0, common_1.Get)('tele-reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReportController.prototype, "teleReportSummary", null);
__decorate([
    (0, common_1.Get)('shop-orders'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReportController.prototype, "shopOrderReport", null);
exports.AdminReportController = AdminReportController = __decorate([
    (0, common_1.Controller)('admin/reports'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminReportController);
