"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const statusLabels = {
    new: 'درخواست جدید',
    pending: 'در انتظار بررسی',
    in_progress: 'در حال بررسی',
    reviewing: 'در حال بررسی',
    completed: 'درخواست تکمیل شد',
    referred: 'درخواست ارجاع شد',
    rejected: 'درخواست رد شد',
};
const statusColors = {
    new: 'warning',
    pending: 'warning',
    in_progress: 'info',
    reviewing: 'info',
    completed: 'success',
    referred: 'success',
    rejected: 'error',
};
class UpdateReferralStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['new', 'in_progress', 'completed', 'rejected']),
    __metadata("design:type", String)
], UpdateReferralStatusDto.prototype, "status", void 0);
let DashboardController = class DashboardController {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const counts = requests.reduce((result, request) => {
            const status = request.status.toLowerCase();
            result.total += 1;
            if (status === 'new' || status === 'pending')
                result.new += 1;
            if (status === 'in_progress' || status === 'reviewing' || status === 'referred')
                result.inReview += 1;
            if (status === 'completed')
                result.completed += 1;
            return result;
        }, { total: 0, new: 0, inReview: 0, completed: 0 });
        const notifications = requests.slice(0, 5).map((request) => ({
            id: request.id,
            title: `${statusLabels[request.status.toLowerCase()] ?? 'به‌روزرسانی درخواست'} ${request.requestNumber}`,
            description: `${request.patientFirstName} ${request.patientLastName} · ${request.imagingType}`,
            status: statusColors[request.status.toLowerCase()] ?? 'info',
            createdAt: request.updatedAt ?? request.createdAt,
        }));
        return { stats: counts, notifications };
    }
    async listReferrals(status, imagingType, from, to, search, pageParam, limitParam) {
        const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        if (imagingType && imagingType !== 'all')
            where.imagingType = imagingType;
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
            if (to)
                where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
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
    async updateReferralStatus(id, body) {
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
    getFinanceSummary() {
        return {
            totalIncome: 0,
            settleableIncome: 0,
            settledIncome: 0,
            incomeGeneratingRequestsCount: 0,
            currency: 'IRR',
            isUnderDevelopment: true,
            developmentNotice: 'بخش مالی و درآمد پزشک در حال توسعه است. محاسبه و تسویه درآمد در نسخه فعلی فعال نیست.',
            transactions: [],
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('referrals'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('imagingType')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "listReferrals", null);
__decorate([
    (0, common_1.Patch)('referrals/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateReferralStatusDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "updateReferralStatus", null);
__decorate([
    (0, common_1.Get)('finance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getFinanceSummary", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardController);
