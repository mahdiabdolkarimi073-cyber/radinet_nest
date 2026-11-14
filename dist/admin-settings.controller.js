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
exports.AdminSettingsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
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
function verifySuperAdmin(auth) {
    return verifyAdmin(auth);
}
// ── General Settings DTOs ──
class UpdateGeneralSettingsDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "siteName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "emailHost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "emailPort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "emailUser", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "emailFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "smsProvider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "smsApiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGeneralSettingsDto.prototype, "smsSenderNumber", void 0);
// ── Country Config DTOs ──
class CreateCountryConfigDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "currencySymbol", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "phonePrefix", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCountryConfigDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCountryConfigDto.prototype, "displayOrder", void 0);
class UpdateCountryConfigDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "currencyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "currencySymbol", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "phonePrefix", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCountryConfigDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCountryConfigDto.prototype, "displayOrder", void 0);
// ── Payment Gateway DTOs ──
class CreatePaymentGatewayDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "merchantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentGatewayDto.prototype, "callbackUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePaymentGatewayDto.prototype, "sandboxMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePaymentGatewayDto.prototype, "isActive", void 0);
class UpdatePaymentGatewayDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentGatewayDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentGatewayDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentGatewayDto.prototype, "merchantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentGatewayDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentGatewayDto.prototype, "callbackUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePaymentGatewayDto.prototype, "sandboxMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePaymentGatewayDto.prototype, "isActive", void 0);
// ── Security Settings DTOs ──
class UpdateSecuritySettingsDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "maxLoginAttempts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "sessionTimeoutMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "passwordMinLength", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "passwordRequireUppercase", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "passwordRequireNumbers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "passwordRequireSymbols", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "twoFactorRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecuritySettingsDto.prototype, "ipWhitelist", void 0);
let AdminSettingsController = class AdminSettingsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── General Settings ──
    async getGeneralSettings(auth) {
        verifyAdmin(auth);
        const setting = await this.prisma.siteSetting.findUnique({
            where: { settingKey: 'general_settings' },
        });
        return setting?.settingValue ?? {};
    }
    async updateGeneralSettings(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.siteSetting.findUnique({
            where: { settingKey: 'general_settings' },
        });
        const current = existing?.settingValue && typeof existing.settingValue === 'object' && !Array.isArray(existing.settingValue)
            ? existing.settingValue
            : {};
        const updated = { ...current, ...dto };
        await this.prisma.siteSetting.upsert({
            where: { settingKey: 'general_settings' },
            create: { settingKey: 'general_settings', settingValue: updated },
            update: { settingValue: updated },
        });
        return updated;
    }
    // ── Country Configs ──
    async listCountries(auth) {
        verifyAdmin(auth);
        return this.prisma.countryConfig.findMany({
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });
    }
    async createCountry(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.countryConfig.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.BadRequestException('این کشور قبلاً ثبت شده است');
        return this.prisma.countryConfig.create({
            data: {
                code: dto.code,
                name: dto.name,
                currencyCode: dto.currencyCode ?? 'IRR',
                currencySymbol: dto.currencySymbol ?? '﷼',
                language: dto.language ?? 'fa',
                phonePrefix: dto.phonePrefix ?? '+98',
                isActive: dto.isActive ?? true,
                displayOrder: dto.displayOrder ? Number.parseInt(dto.displayOrder, 10) : 0,
            },
        });
    }
    async updateCountry(auth, id, dto) {
        verifyAdmin(auth);
        const country = await this.prisma.countryConfig.findUnique({ where: { id } });
        if (!country)
            throw new common_1.NotFoundException('کشور یافت نشد');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.currencyCode !== undefined)
            data.currencyCode = dto.currencyCode;
        if (dto.currencySymbol !== undefined)
            data.currencySymbol = dto.currencySymbol;
        if (dto.language !== undefined)
            data.language = dto.language;
        if (dto.phonePrefix !== undefined)
            data.phonePrefix = dto.phonePrefix;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.displayOrder !== undefined)
            data.displayOrder = Number.parseInt(dto.displayOrder, 10) || 0;
        return this.prisma.countryConfig.update({ where: { id }, data });
    }
    async deleteCountry(auth, id) {
        verifyAdmin(auth);
        const country = await this.prisma.countryConfig.findUnique({ where: { id } });
        if (!country)
            throw new common_1.NotFoundException('کشور یافت نشد');
        await this.prisma.countryConfig.delete({ where: { id } });
        return { ok: true };
    }
    // ── Payment Gateways ──
    async listPaymentGateways(auth) {
        verifyAdmin(auth);
        return this.prisma.paymentGatewayConfig.findMany({
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });
    }
    async createPaymentGateway(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.paymentGatewayConfig.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.BadRequestException('این کد درگاه قبلاً ثبت شده است');
        return this.prisma.paymentGatewayConfig.create({
            data: {
                name: dto.name,
                code: dto.code,
                provider: dto.provider,
                merchantId: dto.merchantId,
                apiKey: dto.apiKey,
                callbackUrl: dto.callbackUrl,
                sandboxMode: dto.sandboxMode ?? false,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updatePaymentGateway(auth, id, dto) {
        verifyAdmin(auth);
        const gateway = await this.prisma.paymentGatewayConfig.findUnique({ where: { id } });
        if (!gateway)
            throw new common_1.NotFoundException('درگاه پرداخت یافت نشد');
        return this.prisma.paymentGatewayConfig.update({ where: { id }, data: dto });
    }
    async deletePaymentGateway(auth, id) {
        verifyAdmin(auth);
        const gateway = await this.prisma.paymentGatewayConfig.findUnique({ where: { id } });
        if (!gateway)
            throw new common_1.NotFoundException('درگاه پرداخت یافت نشد');
        await this.prisma.paymentGatewayConfig.delete({ where: { id } });
        return { ok: true };
    }
    // ── Security Settings ──
    async getSecuritySettings(auth) {
        verifyAdmin(auth);
        const setting = await this.prisma.securitySetting.findUnique({
            where: { settingKey: 'security_settings' },
        });
        return setting?.settingValue ?? {
            maxLoginAttempts: 5,
            sessionTimeoutMinutes: 60,
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireNumbers: true,
            passwordRequireSymbols: false,
            twoFactorRequired: false,
            ipWhitelist: '',
        };
    }
    async updateSecuritySettings(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.securitySetting.findUnique({
            where: { settingKey: 'security_settings' },
        });
        const current = existing?.settingValue && typeof existing.settingValue === 'object' && !Array.isArray(existing.settingValue)
            ? existing.settingValue
            : {
                maxLoginAttempts: 5,
                sessionTimeoutMinutes: 60,
                passwordMinLength: 8,
                passwordRequireUppercase: true,
                passwordRequireNumbers: true,
                passwordRequireSymbols: false,
                twoFactorRequired: false,
                ipWhitelist: '',
            };
        const data = { ...current };
        if (dto.maxLoginAttempts !== undefined)
            data.maxLoginAttempts = Number.parseInt(dto.maxLoginAttempts, 10) || 5;
        if (dto.sessionTimeoutMinutes !== undefined)
            data.sessionTimeoutMinutes = Number.parseInt(dto.sessionTimeoutMinutes, 10) || 60;
        if (dto.passwordMinLength !== undefined)
            data.passwordMinLength = Number.parseInt(dto.passwordMinLength, 10) || 8;
        if (dto.passwordRequireUppercase !== undefined)
            data.passwordRequireUppercase = dto.passwordRequireUppercase === 'true';
        if (dto.passwordRequireNumbers !== undefined)
            data.passwordRequireNumbers = dto.passwordRequireNumbers === 'true';
        if (dto.passwordRequireSymbols !== undefined)
            data.passwordRequireSymbols = dto.passwordRequireSymbols === 'true';
        if (dto.twoFactorRequired !== undefined)
            data.twoFactorRequired = dto.twoFactorRequired === 'true';
        if (dto.ipWhitelist !== undefined)
            data.ipWhitelist = dto.ipWhitelist;
        await this.prisma.securitySetting.upsert({
            where: { settingKey: 'security_settings' },
            create: { settingKey: 'security_settings', settingValue: data },
            update: { settingValue: data },
        });
        return data;
    }
    // ── Public Settings Endpoint ──
    async getPublicSettings() {
        const setting = await this.prisma.siteSetting.findUnique({
            where: { settingKey: 'general_settings' },
        });
        const val = setting?.settingValue && typeof setting.settingValue === 'object' && !Array.isArray(setting.settingValue)
            ? setting.settingValue
            : {};
        return {
            siteName: typeof val.siteName === 'string' && val.siteName.trim() ? val.siteName.trim() : 'رادینت',
            logoUrl: typeof val.logoUrl === 'string' ? val.logoUrl.trim() : '',
        };
    }
    // ── Admin Management (Restricted to role === 'admin') ──
    async listSuperAdmins(auth) {
        verifySuperAdmin(auth);
        return this.prisma.user.findMany({
            where: { role: 'admin' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                country: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createSuperAdmin(auth, body) {
        const actor = verifySuperAdmin(auth);
        if (!body.email?.trim() || !body.password?.trim()) {
            throw new common_1.BadRequestException('ایمیل و رمز عبور الزامی است');
        }
        const email = body.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('کاربری با این ایمیل از قبل در سامانه ثبت شده است');
        }
        const passwordHash = await bcrypt.hash(body.password.trim(), 10);
        const created = await this.prisma.user.create({
            data: {
                fullName: body.fullName?.trim() || 'مدیر سیستم',
                email,
                passwordHash,
                role: 'admin',
                status: 'active',
                country: 'IR',
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                country: true,
                createdAt: true,
            },
        });
        try {
            await this.prisma.systemAuthLog.create({
                data: {
                    requestId: (0, crypto_1.randomUUID)(),
                    operation: 'CREATE_ADMIN',
                    routePath: '/admin/settings/super-admins',
                    maskedIdentifier: email,
                    operationResult: 'SUCCESS',
                    metadata: {
                        actorId: actor.sub || actor.userId,
                        createdAdminId: created.id,
                        email,
                    },
                },
            });
        }
        catch { }
        return created;
    }
    async updateSuperAdmin(auth, id, body) {
        const actor = verifySuperAdmin(auth);
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.role !== 'admin') {
            throw new common_1.NotFoundException('حساب مدیر یافت نشد');
        }
        if (body.status === 'inactive' && target.status === 'active') {
            const activeCount = await this.prisma.user.count({
                where: { role: 'admin', status: 'active' },
            });
            if (activeCount <= 1) {
                throw new common_1.BadRequestException('غیرفعال‌سازی آخرین مدیر فعال سامانه مجاز نیست.');
            }
        }
        const data = {};
        if (body.fullName !== undefined)
            data.fullName = body.fullName.trim();
        if (body.email !== undefined)
            data.email = body.email.trim().toLowerCase();
        if (body.status !== undefined)
            data.status = body.status;
        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
        try {
            await this.prisma.systemAuthLog.create({
                data: {
                    requestId: (0, crypto_1.randomUUID)(),
                    operation: 'UPDATE_ADMIN',
                    routePath: `/admin/settings/super-admins/${id}`,
                    maskedIdentifier: updated.email,
                    operationResult: 'SUCCESS',
                    metadata: { actorId: actor.sub || actor.userId, targetId: id, changes: body },
                },
            });
        }
        catch { }
        return updated;
    }
    async deleteSuperAdmin(auth, id) {
        const actor = verifySuperAdmin(auth);
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.role !== 'admin') {
            throw new common_1.NotFoundException('حساب مدیر یافت نشد');
        }
        const activeCount = await this.prisma.user.count({
            where: { role: 'admin', status: 'active' },
        });
        if (activeCount <= 1) {
            throw new common_1.BadRequestException('حذف آخرین مدیر فعال سامانه مجاز نیست.');
        }
        await this.prisma.user.delete({ where: { id } });
        try {
            await this.prisma.systemAuthLog.create({
                data: {
                    requestId: (0, crypto_1.randomUUID)(),
                    operation: 'DELETE_ADMIN',
                    routePath: `/admin/settings/super-admins/${id}`,
                    maskedIdentifier: target.email,
                    operationResult: 'SUCCESS',
                    metadata: { actorId: actor.sub || actor.userId, deletedId: id, email: target.email },
                },
            });
        }
        catch { }
        return { ok: true, message: 'حساب مدیر با موفقیت حذف شد' };
    }
    async changeSuperAdminPassword(auth, body) {
        const actor = verifySuperAdmin(auth);
        if (!body.currentPassword?.trim() || !body.newPassword?.trim()) {
            throw new common_1.BadRequestException('رمز عبور فعلی و رمز عبور جدید الزامی هستند');
        }
        if (body.newPassword.trim().length < 8) {
            throw new common_1.BadRequestException('رمز عبور جدید باید حداقل ۸ کاراکتر باشد');
        }
        const userId = (actor.sub || actor.userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'admin') {
            throw new common_1.NotFoundException('حساب کاربری یافت نشد');
        }
        const isMatch = await bcrypt.compare(body.currentPassword.trim(), user.passwordHash);
        if (!isMatch) {
            throw new common_1.BadRequestException('رمز عبور فعلی واردشده نادرست است');
        }
        const newHash = await bcrypt.hash(body.newPassword.trim(), 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash, updatedAt: new Date() },
        });
        try {
            await this.prisma.systemAuthLog.create({
                data: {
                    requestId: (0, crypto_1.randomUUID)(),
                    operation: 'ADMIN_PASSWORD_CHANGED',
                    routePath: '/admin/settings/super-admins/change-password',
                    maskedIdentifier: user.email,
                    operationResult: 'SUCCESS',
                    metadata: { actorId: userId, email: user.email },
                },
            });
        }
        catch { }
        return { ok: true, message: 'رمز عبور حساب مدیر با موفقیت تغییر یافت.' };
    }
};
exports.AdminSettingsController = AdminSettingsController;
__decorate([
    (0, common_1.Get)('general'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "getGeneralSettings", null);
__decorate([
    (0, common_1.Patch)('general'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateGeneralSettingsDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateGeneralSettings", null);
__decorate([
    (0, common_1.Get)('countries'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "listCountries", null);
__decorate([
    (0, common_1.Post)('countries'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCountryConfigDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "createCountry", null);
__decorate([
    (0, common_1.Patch)('countries/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateCountryConfigDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateCountry", null);
__decorate([
    (0, common_1.Delete)('countries/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "deleteCountry", null);
__decorate([
    (0, common_1.Get)('payment-gateways'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "listPaymentGateways", null);
__decorate([
    (0, common_1.Post)('payment-gateways'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreatePaymentGatewayDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "createPaymentGateway", null);
__decorate([
    (0, common_1.Patch)('payment-gateways/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdatePaymentGatewayDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updatePaymentGateway", null);
__decorate([
    (0, common_1.Delete)('payment-gateways/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "deletePaymentGateway", null);
__decorate([
    (0, common_1.Get)('security'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "getSecuritySettings", null);
__decorate([
    (0, common_1.Patch)('security'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateSecuritySettingsDto]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateSecuritySettings", null);
__decorate([
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "getPublicSettings", null);
__decorate([
    (0, common_1.Get)('super-admins'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "listSuperAdmins", null);
__decorate([
    (0, common_1.Post)('super-admins'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "createSuperAdmin", null);
__decorate([
    (0, common_1.Patch)('super-admins/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateSuperAdmin", null);
__decorate([
    (0, common_1.Delete)('super-admins/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "deleteSuperAdmin", null);
__decorate([
    (0, common_1.Post)('super-admins/change-password'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "changeSuperAdminPassword", null);
exports.AdminSettingsController = AdminSettingsController = __decorate([
    (0, common_1.Controller)('admin/settings'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminSettingsController);
