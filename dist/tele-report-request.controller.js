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
exports.TeleReportRequestController = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const class_validator_1 = require("class-validator");
const multipart_upload_1 = require("./multipart-upload");
const prisma_service_1 = require("./prisma.service");
const tele_report_validation_1 = require("./tele-report-validation");
const uploadDirectory = (0, path_1.join)(process.cwd(), 'uploads', 'tele-report');
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/dicom',
    'application/octet-stream',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.dicom']);
(0, fs_1.mkdirSync)(uploadDirectory, { recursive: true });
class CheckPatientDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10),
    __metadata("design:type", String)
], CheckPatientDto.prototype, "nationalId", void 0);
class CreateTeleReportRequestDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "requestNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 40),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "patientFirstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "patientLastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 30),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "passportNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(7, 30),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], CreateTeleReportRequestDto.prototype, "age", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['male', 'female']),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 5000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "clinicalHistory", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 5000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "symptoms", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "imagingArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "studyDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "pacsUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "cloudUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], CreateTeleReportRequestDto.prototype, "aiAnalysisResult", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], CreateTeleReportRequestDto.prototype, "aiSuggestedPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "aiConfirmedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], CreateTeleReportRequestDto.prototype, "attachments", void 0);
class SetReferralPathDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['auto', 'smart', 'manual']),
    __metadata("design:type", String)
], SetReferralPathDto.prototype, "referralPath", void 0);
let TeleReportRequestController = class TeleReportRequestController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkPatientGet(body) {
        if (!body?.nationalId)
            return { exists: false, hasHistory: false };
        const patient = await this.prisma.teleReportRequest.findFirst({
            where: { nationalId: body.nationalId.trim() },
            select: { id: true },
        });
        return { exists: Boolean(patient), hasHistory: Boolean(patient) };
    }
    async checkPatient(body) {
        const patient = await this.prisma.teleReportRequest.findFirst({
            where: { nationalId: body.nationalId.trim() },
            select: { id: true },
        });
        return { exists: Boolean(patient), hasHistory: Boolean(patient) };
    }
    async create(auth, body, files = []) {
        try {
            const validatedAge = (0, tele_report_validation_1.parseValidatedAge)(body.age, { required: true });
            if (!body.nationalId?.trim() && !body.passportNumber?.trim()) {
                throw new common_1.BadRequestException('کد ملی یا شماره پاسپورت الزامی است');
            }
            if (!body.pacsUrl?.trim() && !body.cloudUrl?.trim() && files.length === 0) {
                throw new common_1.BadRequestException('حداقل یک فایل یا لینک تصویربرداری وارد کنید');
            }
            const validatedStudyDate = (0, tele_report_validation_1.parseOptionalValidDate)(body.studyDate, 'تاریخ تصویربرداری');
            const validatedAiConfirmedAt = (0, tele_report_validation_1.parseOptionalValidDate)(body.aiConfirmedAt, 'زمان تأیید تحلیل هوش مصنوعی');
            let parsedAi = undefined;
            if (typeof body.aiAnalysisResult === 'string' && body.aiAnalysisResult.trim()) {
                try {
                    parsedAi = JSON.parse(body.aiAnalysisResult);
                }
                catch {
                    throw new common_1.BadRequestException('فرمت نتیجه تحلیل هوش مصنوعی نامعتبر است');
                }
            }
            else if (body.aiAnalysisResult && typeof body.aiAnalysisResult === 'object') {
                parsedAi = body.aiAnalysisResult;
            }
            const aiPriceRaw = body.aiSuggestedPrice !== undefined && body.aiSuggestedPrice !== ''
                ? body.aiSuggestedPrice
                : parsedAi?.suggestedPrice;
            const aiSuggestedPrice = (0, tele_report_validation_1.parseOptionalNonNegativeNumber)(aiPriceRaw, 'مبلغ پیشنهادی هوش مصنوعی');
            if (body.idempotencyKey?.trim()) {
                const existing = await this.prisma.teleReportRequest.findUnique({
                    where: { idempotencyKey: body.idempotencyKey.trim() },
                });
                if (existing) {
                    await (0, tele_report_validation_1.cleanupUploadedFiles)(files);
                    return {
                        id: existing.id,
                        requestNumber: existing.requestNumber,
                        status: existing.status,
                        createdAt: existing.createdAt,
                    };
                }
            }
            const isUuid = (v) => Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()));
            let resolvedUserId = isUuid(body.userId) ? body.userId.trim() : null;
            if (!resolvedUserId && auth?.startsWith('Bearer ')) {
                try {
                    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me');
                    if (typeof decoded.sub === 'string' && isUuid(decoded.sub))
                        resolvedUserId = decoded.sub;
                }
                catch { }
            }
            const requestNumber = body.requestNumber?.trim() ||
                `TR-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomUUID)().slice(0, 6).toUpperCase()}`;
            const request = await this.prisma.teleReportRequest.create({
                data: {
                    requestNumber,
                    userId: resolvedUserId,
                    country: body.country.trim(),
                    language: body.language.trim(),
                    patientFirstName: body.patientFirstName.trim(),
                    patientLastName: body.patientLastName.trim(),
                    nationalId: body.nationalId?.trim() || null,
                    passportNumber: body.passportNumber?.trim() || null,
                    phone: body.phone.trim(),
                    city: body.city.trim(),
                    age: validatedAge,
                    gender: body.gender,
                    clinicalHistory: body.clinicalHistory.trim(),
                    symptoms: body.symptoms.trim(),
                    imagingType: body.imagingType.trim(),
                    imagingArea: body.imagingArea.trim(),
                    studyDate: validatedStudyDate,
                    pacsUrl: body.pacsUrl?.trim() || null,
                    cloudUrl: body.cloudUrl?.trim() || null,
                    idempotencyKey: body.idempotencyKey?.trim() || null,
                    aiAnalysisResult: parsedAi !== undefined ? parsedAi : undefined,
                    aiSuggestedPrice,
                    aiConfirmedAt: validatedAiConfirmedAt,
                    status: 'pending_payment',
                    paymentStatus: 'unpaid',
                    attachments: files.length
                        ? {
                            create: files.map((file) => ({
                                originalName: file.originalname,
                                storedName: file.filename,
                                mimeType: file.mimetype,
                                size: file.size,
                                storagePath: file.path,
                            })),
                        }
                        : undefined,
                },
                include: { attachments: true },
            });
            return {
                id: request.id,
                requestNumber: request.requestNumber,
                status: request.status,
                createdAt: request.createdAt,
            };
        }
        catch (error) {
            await (0, tele_report_validation_1.cleanupUploadedFiles)(files);
            throw error;
        }
    }
    async findOne(requestNumber) {
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { requestNumber },
        });
        if (!request)
            throw new common_1.BadRequestException('درخواست پیدا نشد');
        return request;
    }
    async setReferralPath(requestNumber, body) {
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { requestNumber },
            select: { id: true, status: true },
        });
        if (!request)
            throw new common_1.BadRequestException('درخواست پیدا نشد');
        if (body.referralPath !== 'auto') {
            throw new common_1.BadRequestException('مسیر انتخاب‌شده در حال حاضر قابل دسترسی نیست. در توسعه آینده امکان‌دسترسی خواهد بود.');
        }
        const updated = await this.prisma.teleReportRequest.update({
            where: { requestNumber },
            data: {
                referralPath: body.referralPath,
                referredAt: new Date(),
                status: 'referred',
            },
            select: { requestNumber: true, status: true, referralPath: true, referredAt: true },
        });
        return {
            requestNumber: updated.requestNumber,
            status: updated.status,
            referralPath: updated.referralPath,
            referredAt: updated.referredAt,
            message: 'ارجاع با موفقیت ثبت شد. تیم رادینت درخواست شما را دریافت کرد و به‌زودی گزارش را آماده خواهد کرد.',
        };
    }
};
exports.TeleReportRequestController = TeleReportRequestController;
__decorate([
    (0, common_1.Get)('check-patient'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "checkPatientGet", null);
__decorate([
    (0, common_1.Post)('check-patient'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckPatientDto]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "checkPatient", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)(new multipart_upload_1.MultipartUploadInterceptor({
        fieldName: 'files',
        destination: uploadDirectory,
        maxFiles: 20,
        maxFileSize: 25 * 1024 * 1024,
        maxFieldSize: 2 * 1024 * 1024,
        allowedMimeTypes,
        allowedExtensions,
        invalidFileMessage: 'فرمت فایل مجاز نیست',
    })),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, multipart_upload_1.UploadedMultipartFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateTeleReportRequestDto, Array]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':requestNumber'),
    __param(0, (0, common_1.Param)('requestNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':requestNumber/referral-path'),
    __param(0, (0, common_1.Param)('requestNumber')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetReferralPathDto]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "setReferralPath", null);
exports.TeleReportRequestController = TeleReportRequestController = __decorate([
    (0, common_1.Controller)('tele-report/requests'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeleReportRequestController);
