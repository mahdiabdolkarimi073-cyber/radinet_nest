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
exports.AdminDiscountController = void 0;
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
class CreateDiscountCodeDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['percent', 'fixed']),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDiscountCodeDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiscountCodeDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiscountCodeDto.prototype, "maxDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateDiscountCodeDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDiscountCodeDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiscountCodeDto.prototype, "targetUserId", void 0);
class UpdateDiscountCodeDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDiscountCodeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['percent', 'fixed']),
    __metadata("design:type", String)
], UpdateDiscountCodeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDiscountCodeDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDiscountCodeDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDiscountCodeDto.prototype, "maxDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateDiscountCodeDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDiscountCodeDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDiscountCodeDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDiscountCodeDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDiscountCodeDto.prototype, "targetUserId", void 0);
class DiscountQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscountQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscountQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscountQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscountQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DiscountQueryDto.prototype, "limit", void 0);
let AdminDiscountController = class AdminDiscountController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listDiscounts(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.type && query.type !== 'all')
            where.type = query.type;
        if (query.status === 'active')
            where.isActive = true;
        else if (query.status === 'inactive')
            where.isActive = false;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { code: { contains: value, mode: 'insensitive' } },
                { description: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, rawItems] = await Promise.all([
            this.prisma.shopDiscount.count({ where }),
            this.prisma.shopDiscount.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rawItems.map((d) => {
            const match = d.description.match(/\[targetUser:([^\]]+)\]/);
            const targetUserId = match ? match[1] : null;
            const cleanDesc = d.description.replace(/\[targetUser:[^\]]+\]/, '').trim();
            return {
                ...d,
                description: cleanDesc,
                targetUserId,
                isUserSpecific: Boolean(targetUserId),
            };
        });
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    async getDiscount(auth, id) {
        verifyAdmin(auth);
        const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
        if (!discount)
            throw new common_1.NotFoundException('کد تخفیف یافت نشد');
        const match = discount.description.match(/\[targetUser:([^\]]+)\]/);
        const targetUserId = match ? match[1] : null;
        const cleanDesc = discount.description.replace(/\[targetUser:[^\]]+\]/, '').trim();
        return {
            ...discount,
            description: cleanDesc,
            targetUserId,
            isUserSpecific: Boolean(targetUserId),
        };
    }
    async createDiscount(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.shopDiscount.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.BadRequestException('این کد تخفیف قبلاً ثبت شده است');
        if (dto.targetUserId) {
            const user = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
            if (!user)
                throw new common_1.BadRequestException('کاربر هدف یافت نشد');
        }
        const rawDesc = (dto.description ?? '').trim();
        const finalDesc = dto.targetUserId ? `${rawDesc} [targetUser:${dto.targetUserId}]`.trim() : rawDesc;
        return this.prisma.shopDiscount.create({
            data: {
                code: dto.code,
                description: finalDesc,
                type: dto.type,
                value: dto.value,
                minOrderAmount: dto.minOrderAmount,
                maxDiscountAmount: dto.maxDiscountAmount,
                usageLimit: dto.usageLimit,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateDiscount(auth, id, dto) {
        verifyAdmin(auth);
        const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
        if (!discount)
            throw new common_1.NotFoundException('کد تخفیف یافت نشد');
        const data = {};
        if (dto.description !== undefined || dto.targetUserId !== undefined) {
            const baseDesc = dto.description !== undefined
                ? dto.description.trim()
                : discount.description.replace(/\[targetUser:[^\]]+\]/, '').trim();
            const currentTargetUser = dto.targetUserId !== undefined
                ? dto.targetUserId
                : (discount.description.match(/\[targetUser:([^\]]+)\]/)?.[1] ?? null);
            data.description = currentTargetUser ? `${baseDesc} [targetUser:${currentTargetUser}]`.trim() : baseDesc;
        }
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.value !== undefined)
            data.value = dto.value;
        if (dto.minOrderAmount !== undefined)
            data.minOrderAmount = dto.minOrderAmount;
        if (dto.maxDiscountAmount !== undefined)
            data.maxDiscountAmount = dto.maxDiscountAmount;
        if (dto.usageLimit !== undefined)
            data.usageLimit = dto.usageLimit;
        if (dto.startsAt !== undefined)
            data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
        if (dto.endsAt !== undefined)
            data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        return this.prisma.shopDiscount.update({ where: { id }, data });
    }
    async deleteDiscount(auth, id) {
        verifyAdmin(auth);
        const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
        if (!discount)
            throw new common_1.NotFoundException('کد تخفیف یافت نشد');
        await this.prisma.shopDiscount.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AdminDiscountController = AdminDiscountController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DiscountQueryDto]),
    __metadata("design:returntype", Promise)
], AdminDiscountController.prototype, "listDiscounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDiscountController.prototype, "getDiscount", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateDiscountCodeDto]),
    __metadata("design:returntype", Promise)
], AdminDiscountController.prototype, "createDiscount", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateDiscountCodeDto]),
    __metadata("design:returntype", Promise)
], AdminDiscountController.prototype, "updateDiscount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDiscountController.prototype, "deleteDiscount", null);
exports.AdminDiscountController = AdminDiscountController = __decorate([
    (0, common_1.Controller)('admin/discounts'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDiscountController);
