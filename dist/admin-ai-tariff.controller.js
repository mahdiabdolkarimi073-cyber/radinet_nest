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
exports.AdminAiTariffController = void 0;
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
// ── Country Tariff Setting DTOs ──
class CreateCountryTariffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCountryTariffDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCountryTariffDto.prototype, "countryName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryTariffDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCountryTariffDto.prototype, "commissionPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCountryTariffDto.prototype, "taxPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCountryTariffDto.prototype, "aiAnalysisEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCountryTariffDto.prototype, "aiAnalysisPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCountryTariffDto.prototype, "rushEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCountryTariffDto.prototype, "rushPriceMultiplier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCountryTariffDto.prototype, "isActive", void 0);
class UpdateCountryTariffDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryTariffDto.prototype, "countryName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryTariffDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCountryTariffDto.prototype, "commissionPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCountryTariffDto.prototype, "taxPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCountryTariffDto.prototype, "aiAnalysisEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCountryTariffDto.prototype, "aiAnalysisPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCountryTariffDto.prototype, "rushEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCountryTariffDto.prototype, "rushPriceMultiplier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCountryTariffDto.prototype, "isActive", void 0);
// ── Area Tariff DTOs ──
class CreateAreaTariffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAreaTariffDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAreaTariffDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAreaTariffDto.prototype, "imagingArea", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAreaTariffDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAreaTariffDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAreaTariffDto.prototype, "isActive", void 0);
class UpdateAreaTariffDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAreaTariffDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAreaTariffDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAreaTariffDto.prototype, "isActive", void 0);
class AreaTariffQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AreaTariffQueryDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AreaTariffQueryDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AreaTariffQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AreaTariffQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AreaTariffQueryDto.prototype, "limit", void 0);
let AdminAiTariffController = class AdminAiTariffController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── AI Analysis Global Toggle ──
    async getAiStatus(auth) {
        verifyAdmin(auth);
        const setting = await this.prisma.siteSetting.findUnique({
            where: { settingKey: 'ai_analysis_global' },
        });
        const value = setting?.settingValue && typeof setting.settingValue === 'object' && !Array.isArray(setting.settingValue)
            ? setting.settingValue
            : {};
        const aiAnalysisEnabled = typeof value.aiAnalysisEnabled === 'boolean'
            ? value.aiAnalysisEnabled
            : typeof value.enabled === 'boolean'
                ? value.enabled
                : true;
        const aiPricingEnabled = typeof value.aiPricingEnabled === 'boolean' ? value.aiPricingEnabled : true;
        const suggestedPrice = typeof value.suggestedPrice === 'number' && Number.isFinite(value.suggestedPrice) && value.suggestedPrice >= 0
            ? Math.round(value.suggestedPrice)
            : 950000;
        return {
            enabled: aiAnalysisEnabled,
            aiAnalysisEnabled,
            aiPricingEnabled,
            suggestedPrice,
            currency: typeof value.currency === 'string' ? value.currency : 'IRR',
        };
    }
    async toggleAiStatus(auth, body) {
        verifyAdmin(auth);
        const current = await this.getAiStatus(auth);
        const nextAnalysisEnabled = typeof body.aiAnalysisEnabled === 'boolean'
            ? body.aiAnalysisEnabled
            : typeof body.enabled === 'boolean'
                ? body.enabled
                : current.aiAnalysisEnabled;
        const nextPricingEnabled = typeof body.aiPricingEnabled === 'boolean' ? body.aiPricingEnabled : current.aiPricingEnabled;
        let nextSuggestedPrice = current.suggestedPrice;
        if (body.suggestedPrice !== undefined) {
            const parsed = Number(body.suggestedPrice);
            if (!Number.isFinite(parsed) || parsed < 0) {
                throw new common_1.BadRequestException('مبلغ پیشنهادی هوش مصنوعی نامعتبر است');
            }
            nextSuggestedPrice = Math.round(parsed);
        }
        const payload = {
            enabled: nextAnalysisEnabled,
            aiAnalysisEnabled: nextAnalysisEnabled,
            aiPricingEnabled: nextPricingEnabled,
            suggestedPrice: nextSuggestedPrice,
            currency: body.currency ?? current.currency ?? 'IRR',
            updatedAt: new Date().toISOString(),
        };
        await this.prisma.siteSetting.upsert({
            where: { settingKey: 'ai_analysis_global' },
            create: {
                settingKey: 'ai_analysis_global',
                settingValue: payload,
            },
            update: {
                settingValue: payload,
            },
        });
        return payload;
    }
    // ── Country Tariff Settings ──
    async listCountryTariffs(auth) {
        verifyAdmin(auth);
        return this.prisma.countryTariffSetting.findMany({
            orderBy: [{ isActive: 'desc' }, { countryName: 'asc' }],
        });
    }
    async getCountryTariff(auth, id) {
        verifyAdmin(auth);
        const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
        if (!setting)
            throw new common_1.NotFoundException('تنظیمات کشور یافت نشد');
        return setting;
    }
    async createCountryTariff(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.countryTariffSetting.findUnique({
            where: { countryCode: dto.countryCode },
        });
        if (existing)
            throw new common_1.BadRequestException('این کشور قبلاً ثبت شده است');
        return this.prisma.countryTariffSetting.create({
            data: {
                countryCode: dto.countryCode,
                countryName: dto.countryName,
                currencyCode: dto.currencyCode ?? 'IRR',
                commissionPercent: dto.commissionPercent ?? 0,
                taxPercent: dto.taxPercent ?? 0,
                aiAnalysisEnabled: dto.aiAnalysisEnabled ?? false,
                aiAnalysisPrice: dto.aiAnalysisPrice ?? 0,
                rushEnabled: dto.rushEnabled ?? false,
                rushPriceMultiplier: dto.rushPriceMultiplier ?? 1,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateCountryTariff(auth, id, dto) {
        verifyAdmin(auth);
        const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
        if (!setting)
            throw new common_1.NotFoundException('تنظیمات کشور یافت نشد');
        return this.prisma.countryTariffSetting.update({
            where: { id },
            data: dto,
        });
    }
    async deleteCountryTariff(auth, id) {
        verifyAdmin(auth);
        const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
        if (!setting)
            throw new common_1.NotFoundException('تنظیمات کشور یافت نشد');
        await this.prisma.countryTariffSetting.delete({ where: { id } });
        return { ok: true };
    }
    // ── Area Tariffs ──
    async listAreaTariffs(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.countryCode && query.countryCode !== 'all')
            where.countryCode = query.countryCode;
        if (query.imagingType && query.imagingType !== 'all')
            where.imagingType = query.imagingType;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { imagingType: { contains: value, mode: 'insensitive' } },
                { imagingArea: { contains: value, mode: 'insensitive' } },
                { countryCode: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.areaTariff.count({ where }),
            this.prisma.areaTariff.findMany({
                where,
                orderBy: [{ countryCode: 'asc' }, { imagingType: 'asc' }, { imagingArea: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    async createAreaTariff(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.areaTariff.findUnique({
            where: {
                countryCode_imagingType_imagingArea: {
                    countryCode: dto.countryCode,
                    imagingType: dto.imagingType,
                    imagingArea: dto.imagingArea,
                },
            },
        });
        if (existing)
            throw new common_1.BadRequestException('این تعرفه قبلاً ثبت شده است');
        return this.prisma.areaTariff.create({
            data: {
                countryCode: dto.countryCode,
                imagingType: dto.imagingType,
                imagingArea: dto.imagingArea,
                price: dto.price,
                currencyCode: dto.currencyCode ?? 'IRR',
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateAreaTariff(auth, id, dto) {
        verifyAdmin(auth);
        const tariff = await this.prisma.areaTariff.findUnique({ where: { id } });
        if (!tariff)
            throw new common_1.NotFoundException('تعرفه یافت نشد');
        return this.prisma.areaTariff.update({
            where: { id },
            data: dto,
        });
    }
    async deleteAreaTariff(auth, id) {
        verifyAdmin(auth);
        const tariff = await this.prisma.areaTariff.findUnique({ where: { id } });
        if (!tariff)
            throw new common_1.NotFoundException('تعرفه یافت نشد');
        await this.prisma.areaTariff.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AdminAiTariffController = AdminAiTariffController;
__decorate([
    (0, common_1.Get)('ai-status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "getAiStatus", null);
__decorate([
    (0, common_1.Patch)('ai-status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "toggleAiStatus", null);
__decorate([
    (0, common_1.Get)('countries'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "listCountryTariffs", null);
__decorate([
    (0, common_1.Get)('countries/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "getCountryTariff", null);
__decorate([
    (0, common_1.Post)('countries'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCountryTariffDto]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "createCountryTariff", null);
__decorate([
    (0, common_1.Patch)('countries/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateCountryTariffDto]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "updateCountryTariff", null);
__decorate([
    (0, common_1.Delete)('countries/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "deleteCountryTariff", null);
__decorate([
    (0, common_1.Get)('areas'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AreaTariffQueryDto]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "listAreaTariffs", null);
__decorate([
    (0, common_1.Post)('areas'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateAreaTariffDto]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "createAreaTariff", null);
__decorate([
    (0, common_1.Patch)('areas/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateAreaTariffDto]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "updateAreaTariff", null);
__decorate([
    (0, common_1.Delete)('areas/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminAiTariffController.prototype, "deleteAreaTariff", null);
exports.AdminAiTariffController = AdminAiTariffController = __decorate([
    (0, common_1.Controller)('admin/ai-tariff'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminAiTariffController);
