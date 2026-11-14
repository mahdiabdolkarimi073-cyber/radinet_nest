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
exports.SupportOrderController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
class OrderQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "search", void 0);
class TrackingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], TrackingDto.prototype, "trackingCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackingDto.prototype, "shippingCompany", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TrackingDto.prototype, "notifyCustomer", void 0);
class OrderStatusDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrderStatusDto.prototype, "notifyCustomer", void 0);
let SupportOrderController = class SupportOrderController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        return this.prisma.shopOrder.findMany({ where: { ...(query.status && query.status !== 'all' ? { status: query.status } : {}), ...(query.search?.trim() ? { OR: [{ orderNumber: { contains: query.search.trim(), mode: 'insensitive' } }, { customerName: { contains: query.search.trim(), mode: 'insensitive' } }, { customerPhone: { contains: query.search.trim() } }] } : {}) }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    }
    async detail(auth, id) { (0, support_auth_1.verifySupportToken)(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id }, include: { items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } } }); if (!order)
        throw new common_1.NotFoundException('سفارش یافت نشد'); return order; }
    async tracking(auth, id, dto) { (0, support_auth_1.verifySupportToken)(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order)
        throw new common_1.NotFoundException('سفارش یافت نشد'); return this.prisma.shopOrder.update({ where: { id }, data: { trackingCode: dto.trackingCode, status: order.status === 'pending' ? 'shipped' : order.status, shippingMethodName: dto.shippingCompany ?? order.shippingMethodName } }); }
    async status(auth, id, dto) { (0, support_auth_1.verifySupportToken)(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order)
        throw new common_1.NotFoundException('سفارش یافت نشد'); return this.prisma.shopOrder.update({ where: { id }, data: { status: dto.status } }); }
    async notify(auth, id, body) { (0, support_auth_1.verifySupportToken)(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order)
        throw new common_1.NotFoundException('سفارش یافت نشد'); return { ok: true, orderId: id, recipient: order.customerPhone, message: body.message ?? `وضعیت سفارش ${order.orderNumber} به‌روزرسانی شد` }; }
};
exports.SupportOrderController = SupportOrderController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, OrderQueryDto]),
    __metadata("design:returntype", Promise)
], SupportOrderController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportOrderController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/tracking'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, TrackingDto]),
    __metadata("design:returntype", Promise)
], SupportOrderController.prototype, "tracking", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, OrderStatusDto]),
    __metadata("design:returntype", Promise)
], SupportOrderController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':id/notify-customer'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SupportOrderController.prototype, "notify", null);
exports.SupportOrderController = SupportOrderController = __decorate([
    (0, common_1.Controller)('support/orders'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportOrderController);
