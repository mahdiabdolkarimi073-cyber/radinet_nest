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
exports.AdminTeleReportController = void 0;
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
class TeleReportQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "assignedDoctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeleReportQueryDto.prototype, "limit", void 0);
class AssignDoctorDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDoctorDto.prototype, "doctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDoctorDto.prototype, "requestNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDoctorDto.prototype, "localId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDoctorDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDoctorDto.prototype, "patientLastName", void 0);
class CreateTariffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateTariffDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTariffDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTariffDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTariffDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTariffDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTariffDto.prototype, "aiAnalysisEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTariffDto.prototype, "aiAnalysisPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTariffDto.prototype, "rushEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTariffDto.prototype, "rushPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTariffDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTariffDto.prototype, "displayOrder", void 0);
class UpdateTariffDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTariffDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTariffDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTariffDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTariffDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTariffDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTariffDto.prototype, "aiAnalysisEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTariffDto.prototype, "aiAnalysisPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTariffDto.prototype, "rushEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTariffDto.prototype, "rushPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTariffDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTariffDto.prototype, "displayOrder", void 0);
let AdminTeleReportController = class AdminTeleReportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listRequests(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.imagingType && query.imagingType !== 'all')
            where.imagingType = query.imagingType;
        if (query.assignedDoctorId && query.assignedDoctorId !== 'all') {
            const reports = await this.prisma.radiologyReport.findMany({
                where: { authorId: query.assignedDoctorId },
                select: { requestId: true },
            });
            where.id = { in: reports.map((r) => r.requestId) };
        }
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { requestNumber: { contains: value, mode: 'insensitive' } },
                { patientFirstName: { contains: value, mode: 'insensitive' } },
                { patientLastName: { contains: value, mode: 'insensitive' } },
                { phone: { contains: value, mode: 'insensitive' } },
                { nationalId: { contains: value, mode: 'insensitive' } },
                { city: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, requests] = await Promise.all([
            this.prisma.teleReportRequest.count({ where }),
            this.prisma.teleReportRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    attachments: {
                        select: { id: true, originalName: true, mimeType: true, size: true },
                    },
                    reports: {
                        select: {
                            id: true,
                            status: true,
                            signed: true,
                            authorId: true,
                            author: { select: { id: true, fullName: true } },
                        },
                    },
                    _count: { select: { infoRequests: true } },
                },
            }),
        ]);
        return {
            items: requests,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getRequest(auth, id) {
        verifyAdmin(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : {
                    OR: [
                        { requestNumber: cleanId },
                        { requestNumber: { equals: cleanId, mode: 'insensitive' } },
                        { requestNumber: { contains: cleanId, mode: 'insensitive' } },
                    ],
                },
            include: {
                attachments: true,
                reports: {
                    include: {
                        author: { select: { id: true, fullName: true, email: true } },
                        images: true,
                    },
                },
                infoRequests: {
                    include: {
                        author: { select: { id: true, fullName: true } },
                    },
                },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        return request;
    }
    async assignDoctor(auth, id, dto) {
        verifyAdmin(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const reqNum = String(dto.requestNumber || '').trim();
        const localId = String(dto.localId || '').trim();
        const whereOr = [];
        if (isUuid(cleanId))
            whereOr.push({ id: cleanId });
        if (cleanId) {
            whereOr.push({ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }, { requestNumber: { contains: cleanId, mode: 'insensitive' } });
        }
        if (reqNum && reqNum !== cleanId) {
            if (isUuid(reqNum))
                whereOr.push({ id: reqNum });
            whereOr.push({ requestNumber: reqNum }, { requestNumber: { equals: reqNum, mode: 'insensitive' } });
        }
        if (localId && localId !== cleanId && localId !== reqNum) {
            if (isUuid(localId))
                whereOr.push({ id: localId });
            whereOr.push({ requestNumber: localId });
        }
        let request = await this.prisma.teleReportRequest.findFirst({
            where: { OR: whereOr },
        });
        if (!request && (dto.phone || dto.patientLastName)) {
            request = await this.prisma.teleReportRequest.findFirst({
                where: {
                    ...(dto.phone ? { phone: dto.phone.trim() } : {}),
                    ...(dto.patientLastName ? { patientLastName: { contains: dto.patientLastName.trim(), mode: 'insensitive' } } : {}),
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        const rawId = String(dto.doctorId || '').trim();
        const cleanDocId = rawId.startsWith('doc-') ? rawId.replace('doc-', '') : rawId;
        // Safely query DoctorProfile without crashing on non-UUID strings
        const profileOr = [];
        if (isUuid(rawId))
            profileOr.push({ id: rawId }, { userId: rawId });
        if (isUuid(cleanDocId) && cleanDocId !== rawId)
            profileOr.push({ id: cleanDocId }, { userId: cleanDocId });
        if (rawId) {
            profileOr.push({ email: { equals: rawId, mode: 'insensitive' } }, { fullName: { equals: rawId, mode: 'insensitive' } });
        }
        if (cleanDocId && cleanDocId !== rawId) {
            profileOr.push({ email: { equals: cleanDocId, mode: 'insensitive' } }, { fullName: { equals: cleanDocId, mode: 'insensitive' } });
        }
        let doctor = profileOr.length > 0
            ? await this.prisma.doctorProfile.findFirst({
                where: { OR: profileOr },
                include: { user: true },
            })
            : null;
        if (!doctor) {
            const userOr = [];
            if (isUuid(rawId))
                userOr.push({ id: rawId });
            if (isUuid(cleanDocId) && cleanDocId !== rawId)
                userOr.push({ id: cleanDocId });
            if (rawId) {
                userOr.push({ email: { equals: rawId, mode: 'insensitive' } }, { fullName: { equals: rawId, mode: 'insensitive' } });
            }
            if (cleanDocId && cleanDocId !== rawId) {
                userOr.push({ email: { equals: cleanDocId, mode: 'insensitive' } }, { fullName: { equals: cleanDocId, mode: 'insensitive' } });
            }
            const user = userOr.length > 0
                ? await this.prisma.user.findFirst({
                    where: {
                        OR: userOr,
                        role: { in: ['radiologist', 'doctor', 'RADIOLOGIST', 'DOCTOR'] },
                    },
                })
                : null;
            if (user) {
                doctor = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
                if (!doctor) {
                    doctor = await this.prisma.doctorProfile.create({
                        data: {
                            userId: user.id,
                            fullName: user.fullName || user.email,
                            email: user.email,
                            specialty: 'متخصص رادیولوژی و تله‌ریپورت',
                            isActive: true,
                            collaborationStatus: 'approved',
                        },
                        include: { user: true },
                    });
                }
            }
        }
        if (!doctor)
            throw new common_1.NotFoundException('پزشک رادیولوژیست مورد نظر در دیتابیس یافت نشد');
        if (!doctor.isActive || doctor.collaborationStatus !== 'approved') {
            await this.prisma.doctorProfile.update({
                where: { id: doctor.id },
                data: { isActive: true, collaborationStatus: 'approved' },
            });
        }
        const doctorUserId = doctor.userId;
        const existingReport = await this.prisma.radiologyReport.findFirst({
            where: { requestId: request.id },
        });
        const report = existingReport
            ? await this.prisma.radiologyReport.update({
                where: { id: existingReport.id },
                data: { authorId: doctorUserId, status: 'draft' },
                include: { author: { select: { id: true, fullName: true, email: true } } },
            })
            : await this.prisma.radiologyReport.create({
                data: {
                    requestId: request.id,
                    authorId: doctorUserId,
                    status: 'draft',
                    findings: '',
                    conclusion: '',
                },
                include: { author: { select: { id: true, fullName: true, email: true } } },
            });
        await this.prisma.teleReportRequest.update({
            where: { id: request.id },
            data: {
                status: 'assigned',
                assignedDoctorId: doctor.id,
                referredAt: new Date(),
            },
        });
        return report;
    }
    async updateRequestStatus(auth, id, body) {
        verifyAdmin(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        return this.prisma.teleReportRequest.update({
            where: { id },
            data: { status: body.status },
            select: { id: true, requestNumber: true, status: true, updatedAt: true },
        });
    }
    async getRequestReports(auth, id) {
        verifyAdmin(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        return this.prisma.radiologyReport.findMany({
            where: { requestId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, fullName: true } },
                images: true,
            },
        });
    }
    async updateReport(auth, id, reportId, body) {
        const admin = verifyAdmin(auth);
        const report = await this.prisma.radiologyReport.findUnique({ where: { id: reportId } });
        if (!report || report.requestId !== id)
            throw new common_1.NotFoundException('گزارش رادیولوژی یافت نشد');
        const data = {};
        if (body.findings !== undefined)
            data.findings = body.findings;
        if (body.conclusion !== undefined)
            data.conclusion = body.conclusion;
        const effectiveStatus = body.decision ?? body.status;
        if (effectiveStatus !== undefined) {
            data.status = effectiveStatus;
            if (effectiveStatus === 'approved' || effectiveStatus === 'final') {
                data.signed = true;
                data.signedAt = report.signedAt ?? new Date();
                data.rejectReason = null;
                data.reviewedBy = typeof admin.sub === 'string' ? admin.sub : 'admin';
                data.reviewedAt = new Date();
            }
            else if (effectiveStatus === 'rejected') {
                data.signed = false;
                data.rejectReason = body.rejectReason?.trim() || 'نیاز به بازبینی و اصلاح گزارش توسط پزشک رادیولوژیست';
                data.reviewedBy = typeof admin.sub === 'string' ? admin.sub : 'admin';
                data.reviewedAt = new Date();
            }
        }
        if (body.signed !== undefined && effectiveStatus === undefined) {
            data.signed = body.signed;
            data.signedAt = body.signed ? new Date() : null;
        }
        if (body.signatureName !== undefined)
            data.signatureName = body.signatureName;
        const updated = await this.prisma.radiologyReport.update({
            where: { id: reportId },
            data,
            include: { author: { select: { id: true, fullName: true } }, images: true },
        });
        if (effectiveStatus === 'approved' || effectiveStatus === 'final' || body.signed) {
            await this.prisma.teleReportRequest.update({
                where: { id },
                data: { status: 'completed' },
            });
        }
        else if (effectiveStatus === 'rejected') {
            await this.prisma.teleReportRequest.update({
                where: { id },
                data: { status: 'in_progress' },
            });
        }
        return updated;
    }
    async verifyAiAnalysis(auth, id, body) {
        verifyAdmin(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        // Create or update a status log
        await this.prisma.orgRequestStatusLog.create({
            data: {
                requestId: id,
                status: body.approved ? 'ai_approved' : 'ai_rejected',
                note: body.notes ?? (body.approved ? 'تحلیل هوش مصنوعی توسط ادمین تأیید گردید.' : 'تحلیل هوش مصنوعی رد شد.'),
            },
        });
        return {
            ok: true,
            requestId: id,
            aiApproved: body.approved ?? true,
            message: body.approved ? 'تحلیل هوش مصنوعی تأیید شد.' : 'تحلیل هوش مصنوعی رد شد.',
        };
    }
    // ── Tariffs ──
    async listTariffs(auth) {
        verifyAdmin(auth);
        return this.prisma.teleReportTariff.findMany({
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async createTariff(auth, dto) {
        verifyAdmin(auth);
        return this.prisma.teleReportTariff.create({
            data: {
                name: dto.name,
                imagingType: dto.imagingType,
                description: dto.description ?? '',
                price: dto.price,
                currency: dto.currency ?? 'IRR',
                aiAnalysisEnabled: dto.aiAnalysisEnabled ?? false,
                aiAnalysisPrice: dto.aiAnalysisPrice ?? 0,
                rushEnabled: dto.rushEnabled ?? false,
                rushPrice: dto.rushPrice ?? 0,
                isActive: dto.isActive ?? true,
                displayOrder: dto.displayOrder ?? 0,
            },
        });
    }
    async updateTariff(auth, id, dto) {
        verifyAdmin(auth);
        const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
        if (!tariff)
            throw new common_1.NotFoundException('تعرفه یافت نشد');
        return this.prisma.teleReportTariff.update({
            where: { id },
            data: dto,
        });
    }
    async approveAiAnalysis(auth, id) {
        verifyAdmin(auth);
        const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
        if (!tariff)
            throw new common_1.NotFoundException('تعرفه یافت نشد');
        return this.prisma.teleReportTariff.update({
            where: { id },
            data: { aiAnalysisEnabled: true },
            select: { id: true, name: true, aiAnalysisEnabled: true, updatedAt: true },
        });
    }
    async rejectAiAnalysis(auth, id) {
        verifyAdmin(auth);
        const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
        if (!tariff)
            throw new common_1.NotFoundException('تعرفه یافت نشد');
        return this.prisma.teleReportTariff.update({
            where: { id },
            data: { aiAnalysisEnabled: false },
            select: { id: true, name: true, aiAnalysisEnabled: true, updatedAt: true },
        });
    }
};
exports.AdminTeleReportController = AdminTeleReportController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TeleReportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Patch)(':id/assign-doctor'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, AssignDoctorDto]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "assignDoctor", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "updateRequestStatus", null);
__decorate([
    (0, common_1.Get)(':id/reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "getRequestReports", null);
__decorate([
    (0, common_1.Patch)(':id/reports/:reportId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('reportId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Patch)(':id/ai-verify'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "verifyAiAnalysis", null);
__decorate([
    (0, common_1.Get)('tariffs/list'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "listTariffs", null);
__decorate([
    (0, common_1.Post)('tariffs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateTariffDto]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "createTariff", null);
__decorate([
    (0, common_1.Patch)('tariffs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateTariffDto]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "updateTariff", null);
__decorate([
    (0, common_1.Patch)('tariffs/:id/approve-ai'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "approveAiAnalysis", null);
__decorate([
    (0, common_1.Patch)('tariffs/:id/reject-ai'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTeleReportController.prototype, "rejectAiAnalysis", null);
exports.AdminTeleReportController = AdminTeleReportController = __decorate([
    (0, common_1.Controller)('admin/tele-reports'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminTeleReportController);
