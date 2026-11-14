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
exports.ReportController = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const multipart_upload_1 = require("./multipart-upload");
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
const reportUploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'report-images');
(0, fs_1.mkdirSync)(reportUploadDir, { recursive: true });
const allowedImageMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
function extractUserId(auth) {
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
class CreateReportDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 36),
    __metadata("design:type", String)
], CreateReportDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 20000),
    __metadata("design:type", String)
], CreateReportDto.prototype, "findings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 10000),
    __metadata("design:type", String)
], CreateReportDto.prototype, "conclusion", void 0);
class UpdateReportDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 20000),
    __metadata("design:type", String)
], UpdateReportDto.prototype, "findings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 10000),
    __metadata("design:type", String)
], UpdateReportDto.prototype, "conclusion", void 0);
class SignReportDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SignReportDto.prototype, "signed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], SignReportDto.prototype, "signatureName", void 0);
class SubmitReportDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 20000),
    __metadata("design:type", String)
], SubmitReportDto.prototype, "findings", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 10000),
    __metadata("design:type", String)
], SubmitReportDto.prototype, "conclusion", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitReportDto.prototype, "signed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], SubmitReportDto.prototype, "signatureName", void 0);
let ReportController = class ReportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listReports(status, search, pageParam, limitParam) {
        const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        if (search?.trim()) {
            const value = search.trim();
            where.OR = [
                { findings: { contains: value, mode: 'insensitive' } },
                { conclusion: { contains: value, mode: 'insensitive' } },
                { request: { requestNumber: { contains: value, mode: 'insensitive' } } },
                { request: { patientFirstName: { contains: value, mode: 'insensitive' } } },
                { request: { patientLastName: { contains: value, mode: 'insensitive' } } },
            ];
        }
        const [total, reports] = await Promise.all([
            this.prisma.radiologyReport.count({ where }),
            this.prisma.radiologyReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    author: { select: { id: true, fullName: true } },
                    request: {
                        select: {
                            id: true,
                            requestNumber: true,
                            patientFirstName: true,
                            patientLastName: true,
                            imagingType: true,
                            imagingArea: true,
                        },
                    },
                },
            }),
        ]);
        return {
            items: reports,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getReportsByRequest(requestId) {
        const reports = await this.prisma.radiologyReport.findMany({
            where: { requestId },
            include: {
                author: { select: { id: true, fullName: true } },
                images: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { items: reports };
    }
    async getReport(id) {
        const report = await this.prisma.radiologyReport.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, fullName: true } },
                images: { orderBy: { createdAt: 'asc' } },
                request: {
                    select: {
                        id: true,
                        requestNumber: true,
                        patientFirstName: true,
                        patientLastName: true,
                        imagingType: true,
                        imagingArea: true,
                    },
                },
            },
        });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        return report;
    }
    async createReport(body, auth) {
        const user = extractUserId(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist')
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { id: body.requestId },
            select: { id: true },
        });
        if (!request)
            throw new common_1.BadRequestException('درخواست بیمار پیدا نشد');
        return this.prisma.radiologyReport.create({
            data: {
                requestId: body.requestId,
                authorId: user.id,
                findings: body.findings ?? '',
                conclusion: body.conclusion ?? '',
                status: 'draft',
            },
            include: { images: true },
        });
    }
    async updateReport(id, body) {
        const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        if (report.status === 'final' || report.status === 'approved') {
            throw new common_1.BadRequestException('گزارش تأیید نهایی شده و قابل ویرایش نیست');
        }
        return this.prisma.radiologyReport.update({
            where: { id },
            data: {
                ...(body.findings !== undefined ? { findings: body.findings } : {}),
                ...(body.conclusion !== undefined ? { conclusion: body.conclusion } : {}),
            },
            include: { images: true },
        });
    }
    async signReport(id, body, auth) {
        const user = extractUserId(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist' && user.role !== 'doctor' && user.role !== 'admin') {
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        }
        const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        return this.prisma.radiologyReport.update({
            where: { id },
            data: {
                signed: body.signed,
                signatureName: body.signed ? (body.signatureName ?? user.name) : null,
                signedAt: body.signed ? new Date() : null,
            },
        });
    }
    async submitReport(id, body, auth) {
        const user = extractUserId(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist' && user.role !== 'doctor' && user.role !== 'admin') {
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        }
        const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        if (report.status === 'final' || report.status === 'approved') {
            throw new common_1.BadRequestException('گزارش قبلاً تأیید نهایی شده است');
        }
        const updated = await this.prisma.radiologyReport.update({
            where: { id },
            data: {
                findings: body.findings,
                conclusion: body.conclusion,
                status: 'pending_approval',
                adminApprovalStatus: 'pending',
                supportApprovalStatus: 'pending',
                rejectReason: null,
                signed: body.signed,
                signatureName: body.signed ? (body.signatureName ?? user.name) : null,
                signedAt: body.signed ? new Date() : null,
            },
            include: {
                images: true,
                request: {
                    select: {
                        id: true,
                        requestNumber: true,
                        patientFirstName: true,
                        patientLastName: true,
                    },
                },
            },
        });
        await this.prisma.teleReportRequest.update({
            where: { id: report.requestId },
            data: { status: 'pending_approval' },
        });
        return updated;
    }
    async uploadImages(id, files = []) {
        const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        if (report.status === 'final')
            throw new common_1.BadRequestException('گزارش نهایی قابل تغییر نیست');
        if (!files.length)
            throw new common_1.BadRequestException('هیچ فایلی ارسال نشد');
        const images = await Promise.all(files.map((file) => this.prisma.radiologyReportImage.create({
            data: {
                reportId: id,
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                storagePath: file.path,
            },
        })));
        return { images };
    }
    async deleteImage(id, imageId) {
        const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
        if (!report)
            throw new common_1.BadRequestException('گزارش پیدا نشد');
        if (report.status === 'final')
            throw new common_1.BadRequestException('گزارش نهایی قابل تغییر نیست');
        await this.prisma.radiologyReportImage.delete({
            where: { id: imageId },
        });
        return { ok: true };
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "listReports", null);
__decorate([
    (0, common_1.Get)('by-request/:requestId'),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getReportsByRequest", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getReport", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateReportDto, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "createReport", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SignReportDto, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "signReport", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SubmitReportDto, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, common_1.UseInterceptors)(new multipart_upload_1.MultipartUploadInterceptor({
        fieldName: 'images',
        destination: reportUploadDir,
        maxFiles: 10,
        maxFileSize: 15 * 1024 * 1024,
        allowedMimeTypes: allowedImageMime,
        allowedExtensions: allowedImageExt,
        invalidFileMessage: 'فقط فایل‌های تصویری JPEG، PNG و WebP مجاز هستند',
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, multipart_upload_1.UploadedMultipartFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Post)(':id/images/:imageId/delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('imageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "deleteImage", null);
exports.ReportController = ReportController = __decorate([
    (0, common_1.Controller)('dashboard/reports'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportController);
