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
exports.UserPanelController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function verifyUserToken(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        const userRole = (payload.role || '').toLowerCase();
        if (userRole !== 'user' && userRole !== 'patient') {
            throw new common_1.UnauthorizedException('دسترسی فقط برای بیماران و کاربران عادی مجاز است');
        }
        if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
            throw new common_1.UnauthorizedException('توکن نامعتبر است');
        }
        return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
    }
    catch (error) {
        if (error instanceof common_1.UnauthorizedException)
            throw error;
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "country", void 0);
class ChangePasswordDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "confirmNewPassword", void 0);
let UserPanelController = class UserPanelController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dashboard(auth) {
        const identity = verifyUserToken(auth);
        const orderWhere = {
            OR: [{ userId: identity.id }, { customerEmail: identity.email }],
        };
        const teleWhere = {
            OR: [{ userId: identity.id }, { phone: identity.email }],
        };
        const consultWhere = { email: identity.email };
        const [orders, teleReports, consultations] = await Promise.all([
            this.prisma.shopOrder.findMany({
                where: orderWhere,
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, items: { select: { productName: true, quantity: true } } },
            }),
            this.prisma.teleReportRequest.findMany({
                where: teleWhere,
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, requestNumber: true, imagingType: true, imagingArea: true, status: true, createdAt: true },
            }),
            this.prisma.consultationRequest.findMany({
                where: consultWhere,
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, name: true, message: true, status: true, createdAt: true },
            }),
        ]);
        const totalOrders = await this.prisma.shopOrder.count({ where: orderWhere });
        const totalTeleReports = await this.prisma.teleReportRequest.count({ where: teleWhere });
        const totalConsultations = await this.prisma.consultationRequest.count({ where: consultWhere });
        return {
            stats: { totalOrders, totalTeleReports, totalConsultations },
            latestOrders: orders,
            latestTeleReports: teleReports,
            latestConsultations: consultations,
        };
    }
    async getProfile(auth) {
        const identity = verifyUserToken(auth);
        const user = await this.prisma.user.findUnique({
            where: { id: identity.id },
            select: { id: true, fullName: true, email: true, role: true, country: true, status: true, createdAt: true },
        });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        return { user };
    }
    async updateProfile(auth, dto) {
        const identity = verifyUserToken(auth);
        const user = await this.prisma.user.findUnique({ where: { id: identity.id } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existing)
                throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
        }
        const updated = await this.prisma.user.update({
            where: { id: identity.id },
            data: {
                ...(dto.fullName ? { fullName: dto.fullName } : {}),
                ...(dto.email ? { email: dto.email } : {}),
                ...(dto.country ? { country: dto.country } : {}),
            },
            select: { id: true, fullName: true, email: true, role: true, country: true, status: true, createdAt: true },
        });
        return { ok: true, user: updated };
    }
    async changePassword(auth, dto) {
        const identity = verifyUserToken(auth);
        if (dto.newPassword !== dto.confirmNewPassword) {
            throw new common_1.BadRequestException('رمز عبور جدید و تکرار آن یکسان نیستند');
        }
        const user = await this.prisma.user.findUnique({ where: { id: identity.id } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid)
            throw new common_1.BadRequestException('رمز عبور فعلی اشتباه است');
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({ where: { id: identity.id }, data: { passwordHash } });
        return { ok: true, message: 'رمز عبور با موفقیت تغییر کرد' };
    }
};
exports.UserPanelController = UserPanelController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserPanelController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserPanelController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UserPanelController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('profile/change-password'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UserPanelController.prototype, "changePassword", null);
exports.UserPanelController = UserPanelController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserPanelController);
