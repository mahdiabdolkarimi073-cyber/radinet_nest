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
exports.TeleReportPaymentController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const gateways = [
    { id: 'zarinpal_sandbox', name: 'درگاه آزمایشی زرین‌پال (شاپرک)', description: 'پرداخت آزمایشی آنلاین و ثبت نهایی درخواست در صف بررسی رادینت', logoText: 'Z', countries: ['IR'] },
    { id: 'saman_sandbox', name: 'درگاه آزمایشی بانک سامان (سپ)', description: 'تراکنش آزمایشی شبیه‌سازی‌شده شاپرک', logoText: 'S', countries: ['IR'] },
    { id: 'stripe_sandbox', name: 'Stripe Experimental Checkout', description: 'پرداخت آزمایشی بین‌المللی', logoText: 'S', countries: ['TR', 'AE', 'DE', 'GB', 'US', 'IQ', 'AF'] },
];
const countryPricing = {
    IR: { name: 'ایران', currency: 'IRR', amount: 950000, currencyLabel: 'تومان' },
    AF: { name: 'افغانستان', currency: 'AFN', amount: 3900, currencyLabel: 'افغانی' },
    IQ: { name: 'عراق', currency: 'IQD', amount: 52000, currencyLabel: 'دینار' },
    TR: { name: 'ترکیه', currency: 'TRY', amount: 1250, currencyLabel: 'لیر' },
    AE: { name: 'امارات', currency: 'AED', amount: 330, currencyLabel: 'درهم' },
    DE: { name: 'آلمان', currency: 'EUR', amount: 85, currencyLabel: 'یورو' },
    GB: { name: 'انگلستان', currency: 'GBP', amount: 75, currencyLabel: 'پوند' },
    US: { name: 'آمریکا', currency: 'USD', amount: 95, currencyLabel: 'دلار' },
};
class PaymentConfigQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentConfigQueryDto.prototype, "country", void 0);
class StartPaymentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "requestNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "gateway", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "paymentMethod", void 0);
class VerifyPaymentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "requestNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "paymentToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "gateway", void 0);
function getConfig(countryCode = 'IR') {
    const code = (countryCode || 'IR').toUpperCase();
    const country = countryPricing[code] ?? countryPricing.IR;
    const availableGateways = gateways.filter((gateway) => gateway.countries.includes(code) || gateway.id === 'stripe_sandbox');
    return {
        country: country.name,
        countryCode: code in countryPricing ? code : 'IR',
        currency: country.currency,
        currencyLabel: country.currencyLabel,
        amount: country.amount,
        formattedAmount: country.amount.toLocaleString('fa-IR'),
        gateways: availableGateways,
    };
}
let TeleReportPaymentController = class TeleReportPaymentController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPaymentConfig(query) {
        return getConfig(query.country);
    }
    async startPayment(body) {
        const config = getConfig(body.country);
        const paymentToken = `PAY-TOKEN-${Date.now().toString(36).toUpperCase()}`;
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { requestNumber: body.requestNumber },
        });
        if (!request) {
            throw new common_1.BadRequestException('درخواست تله‌ریپورت یافت نشد');
        }
        if (request.paymentStatus === 'paid') {
            return {
                alreadyPaid: true,
                requestNumber: request.requestNumber,
                paymentReference: request.paymentReference,
                paymentToken: request.paymentReference,
                amount: Number(request.paymentAmount) || config.amount,
                status: request.status,
            };
        }
        await this.prisma.teleReportRequest.update({
            where: { requestNumber: body.requestNumber },
            data: {
                paymentStatus: 'pending',
                paymentReference: paymentToken,
                paymentAmount: config.amount,
            },
        });
        return {
            alreadyPaid: false,
            requestNumber: body.requestNumber,
            paymentStatus: 'pending',
            paymentToken,
            paymentReference: paymentToken,
            amount: config.amount,
            currency: config.currency,
        };
    }
    async verifyPayment(body) {
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { requestNumber: body.requestNumber },
        });
        if (!request) {
            throw new common_1.BadRequestException('درخواست تله‌ریپورت یافت نشد');
        }
        if (request.paymentStatus === 'paid') {
            return {
                ok: true,
                alreadyPaid: true,
                request,
            };
        }
        const trackingRef = body.paymentToken && body.paymentToken.startsWith('PAY-')
            ? body.paymentToken.replace('PAY-TOKEN-', 'EXP-REF-')
            : `EXP-REF-${Date.now().toString(36).toUpperCase()}`;
        const updated = await this.prisma.teleReportRequest.update({
            where: { requestNumber: body.requestNumber },
            data: {
                paymentStatus: 'paid',
                paymentReference: trackingRef,
                paidAt: new Date(),
                status: request.status === 'pending_payment' || request.status === 'new' ? 'pending_review' : request.status,
            },
        });
        return {
            ok: true,
            alreadyPaid: false,
            request: updated,
        };
    }
};
exports.TeleReportPaymentController = TeleReportPaymentController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaymentConfigQueryDto]),
    __metadata("design:returntype", void 0)
], TeleReportPaymentController.prototype, "getPaymentConfig", null);
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StartPaymentDto]),
    __metadata("design:returntype", Promise)
], TeleReportPaymentController.prototype, "startPayment", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyPaymentDto]),
    __metadata("design:returntype", Promise)
], TeleReportPaymentController.prototype, "verifyPayment", null);
exports.TeleReportPaymentController = TeleReportPaymentController = __decorate([
    (0, common_1.Controller)('tele-report/payments'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeleReportPaymentController);
