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
exports.DoctorProfileController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function extractUser(auth) {
    if (!auth?.startsWith('Bearer '))
        return null;
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (!payload.sub)
            return null;
        return { id: payload.sub, name: payload.name ?? '', role: payload.role ?? 'user' };
    }
    catch {
        return null;
    }
}
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "subSpecialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "biography", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "education", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "certifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(60),
    __metadata("design:type", Number)
], UpdateProfileDto.prototype, "experienceYears", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "languages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 300),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "workplace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateProfileDto.prototype, "maxDailyReports", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "notificationEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "notificationSms", void 0);
let DoctorProfileController = class DoctorProfileController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(auth) {
        const user = extractUser(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist')
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        const userRow = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, fullName: true, email: true },
        });
        if (!userRow)
            throw new common_1.UnauthorizedException('کاربر یافت نشد');
        const profile = await this.prisma.doctorProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                fullName: userRow.fullName,
                email: userRow.email,
            },
        });
        const reportCount = await this.prisma.radiologyReport.count({
            where: { authorId: user.id },
        });
        const finalCount = await this.prisma.radiologyReport.count({
            where: { authorId: user.id, status: 'final' },
        });
        const signedCount = await this.prisma.radiologyReport.count({
            where: { authorId: user.id, signed: true },
        });
        const infoRequestCount = await this.prisma.infoRequest.count({
            where: { authorId: user.id },
        });
        return {
            profile,
            stats: {
                totalReports: reportCount,
                finalReports: finalCount,
                signedReports: signedCount,
                infoRequests: infoRequestCount,
            },
        };
    }
    async updateProfile(body, auth) {
        const user = extractUser(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist')
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        const userRow = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, fullName: true, email: true },
        });
        if (!userRow)
            throw new common_1.UnauthorizedException('کاربر یافت نشد');
        const profile = await this.prisma.doctorProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                fullName: userRow.fullName,
                email: userRow.email,
            },
        });
        const data = {};
        if (body.fullName !== undefined)
            data.fullName = body.fullName;
        if (body.specialty !== undefined)
            data.specialty = body.specialty;
        if (body.subSpecialty !== undefined)
            data.subSpecialty = body.subSpecialty;
        if (body.licenseNumber !== undefined)
            data.licenseNumber = body.licenseNumber;
        if (body.biography !== undefined)
            data.biography = body.biography;
        if (body.education !== undefined)
            data.education = body.education;
        if (body.certifications !== undefined)
            data.certifications = body.certifications;
        if (body.experienceYears !== undefined)
            data.experienceYears = body.experienceYears;
        if (body.languages !== undefined)
            data.languages = body.languages;
        if (body.workplace !== undefined)
            data.workplace = body.workplace;
        if (body.maxDailyReports !== undefined)
            data.maxDailyReports = body.maxDailyReports;
        if (body.notificationEmail !== undefined)
            data.notificationEmail = body.notificationEmail;
        if (body.notificationSms !== undefined)
            data.notificationSms = body.notificationSms;
        if (Object.keys(data).length === 0) {
            throw new common_1.BadRequestException('هیچ فیلدی برای به‌روزرسانی ارسال نشده است');
        }
        return this.prisma.doctorProfile.update({
            where: { userId: user.id },
            data,
        });
    }
};
exports.DoctorProfileController = DoctorProfileController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DoctorProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateProfileDto, String]),
    __metadata("design:returntype", Promise)
], DoctorProfileController.prototype, "updateProfile", null);
exports.DoctorProfileController = DoctorProfileController = __decorate([
    (0, common_1.Controller)('dashboard/doctor-profile'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DoctorProfileController);
