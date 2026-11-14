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
exports.AdminOrderController = void 0;
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
class OrderQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "limit", void 0);
class UpdateOrderStatusDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "trackingCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "note", void 0);
let AdminOrderController = class AdminOrderController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listOrders(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.paymentStatus && query.paymentStatus !== 'all')
            where.paymentStatus = query.paymentStatus;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { orderNumber: { contains: value, mode: 'insensitive' } },
                { customerName: { contains: value, mode: 'insensitive' } },
                { customerPhone: { contains: value, mode: 'insensitive' } },
                { customerEmail: { contains: value, mode: 'insensitive' } },
                { trackingCode: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, orders] = await Promise.all([
            this.prisma.shopOrder.count({ where }),
            this.prisma.shopOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, slug: true, imageUrl: true },
                            },
                        },
                    },
                },
            }),
        ]);
        return {
            items: orders,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getOrder(auth, orderNumber) {
        verifyAdmin(auth);
        const order = await this.prisma.shopOrder.findUnique({
            where: { orderNumber },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, imageUrl: true, sku: true },
                        },
                    },
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('سفارش یافت نشد');
        return order;
    }
    async updateOrderStatus(auth, orderNumber, dto) {
        verifyAdmin(auth);
        const order = await this.prisma.shopOrder.findUnique({ where: { orderNumber } });
        if (!order)
            throw new common_1.NotFoundException('سفارش یافت نشد');
        const data = { status: dto.status };
        if (dto.trackingCode !== undefined)
            data.trackingCode = dto.trackingCode;
        if (dto.paymentStatus !== undefined)
            data.paymentStatus = dto.paymentStatus;
        const updated = await this.prisma.shopOrder.update({
            where: { orderNumber },
            data,
            include: { items: true },
        });
        // Create real database records for customer notification and SMS
        let notificationText = null;
        const statusPersianLabels = {
            pending: 'در انتظار',
            processing: 'در حال پردازش',
            ready_to_ship: 'آماده ارسال',
            shipped: 'ارسال‌شده',
            delivered: 'تحویل‌شده',
            cancelled: 'لغوشده',
        };
        const statusText = statusPersianLabels[dto.status] ?? dto.status;
        const trackingMsg = dto.trackingCode ? ` کد رهگیری پستی: ${dto.trackingCode}` : '';
        const fullMessage = `مشتری گرامی، وضعیت سفارش شماره ${orderNumber} به «${statusText}» تغییر یافت.${trackingMsg}`;
        if (order.userId) {
            await this.prisma.userNotification.create({
                data: {
                    userId: order.userId,
                    title: `به‌روزرسانی سفارش ${orderNumber}`,
                    message: fullMessage,
                    type: 'order',
                },
            });
            notificationText = 'اعلان درون‌برنامه‌ای برای کاربر ثبت شد.';
        }
        if (order.customerPhone) {
            await this.prisma.smsLog.create({
                data: {
                    phoneNumber: order.customerPhone,
                    message: fullMessage,
                    templateKey: dto.status === 'shipped' ? 'order_shipped' : 'order_status',
                    status: 'sent',
                    provider: 'kavenegar',
                    sentAt: new Date(),
                },
            });
            notificationText = (notificationText ? `${notificationText} ` : '') + `پیامک به شماره ${order.customerPhone} ارسال و در تاریخچه ثبت شد.`;
        }
        return {
            order: updated,
            notification: notificationText,
        };
    }
    async getOrderStats(auth) {
        verifyAdmin(auth);
        const [total, pending, processing, readyToShip, shipped, delivered, cancelled, paidRevenue,] = await Promise.all([
            this.prisma.shopOrder.count(),
            this.prisma.shopOrder.count({ where: { status: 'pending' } }),
            this.prisma.shopOrder.count({ where: { status: 'processing' } }),
            this.prisma.shopOrder.count({ where: { status: 'ready_to_ship' } }),
            this.prisma.shopOrder.count({ where: { status: 'shipped' } }),
            this.prisma.shopOrder.count({ where: { status: 'delivered' } }),
            this.prisma.shopOrder.count({ where: { status: 'cancelled' } }),
            this.prisma.shopOrder.aggregate({
                where: { paymentStatus: 'paid' },
                _sum: { total: true },
            }),
        ]);
        return {
            total,
            byStatus: { pending, processing, readyToShip, shipped, delivered, cancelled },
            paidRevenue: Number(paidRevenue._sum.total ?? 0),
        };
    }
};
exports.AdminOrderController = AdminOrderController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, OrderQueryDto]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)(':orderNumber'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)(':orderNumber/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('orderNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateOrderStatusDto]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "getOrderStats", null);
exports.AdminOrderController = AdminOrderController = __decorate([
    (0, common_1.Controller)('admin/orders'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminOrderController);
