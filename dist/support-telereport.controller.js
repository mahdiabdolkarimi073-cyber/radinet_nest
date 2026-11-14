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
exports.SupportTelereportController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
const tele_report_validation_1 = require("./tele-report-validation");
class TelereportQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelereportQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelereportQueryDto.prototype, "search", void 0);
class StatusDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['new', 'pending', 'assigned', 'in_progress', 'coordinating', 'scheduled', 'completed', 'cancelled']),
    __metadata("design:type", String)
], StatusDto.prototype, "status", void 0);
class NotifyDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['patient', 'doctor', 'both']),
    __metadata("design:type", String)
], NotifyDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], NotifyDto.prototype, "message", void 0);
class CoordinateDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CoordinateDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CoordinateDto.prototype, "scheduledAt", void 0);
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
class ReviewReportDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewReportDto.prototype, "reportId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['approved', 'rejected']),
    __metadata("design:type", String)
], ReviewReportDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewReportDto.prototype, "rejectReason", void 0);
let SupportTelereportController = class SupportTelereportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        return this.prisma.teleReportRequest.findMany({
            where: {
                ...(query.status && query.status !== 'all' ? { status: query.status } : {}),
                ...(query.search?.trim()
                    ? {
                        OR: [
                            { requestNumber: { contains: query.search.trim(), mode: 'insensitive' } },
                            { patientFirstName: { contains: query.search.trim(), mode: 'insensitive' } },
                            { patientLastName: { contains: query.search.trim(), mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            include: {
                reports: {
                    select: {
                        id: true,
                        status: true,
                        signed: true,
                        authorId: true,
                        author: { select: { id: true, fullName: true } },
                    },
                },
                _count: { select: { attachments: true, infoRequests: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listDoctors(auth) {
        (0, support_auth_1.verifySupportToken)(auth);
        const [profiles, doctorUsers] = await Promise.all([
            this.prisma.doctorProfile.findMany({
                where: { isActive: true },
                include: { user: { select: { id: true, fullName: true, email: true } } },
            }),
            this.prisma.user.findMany({
                where: { role: { in: ['radiologist', 'doctor'] }, status: 'active' },
                select: { id: true, fullName: true, email: true },
            }),
        ]);
        const map = new Map();
        const seenEmails = new Set();
        for (const p of profiles) {
            const id = p.userId || p.id;
            const email = (p.email || p.user?.email || '').trim().toLowerCase();
            map.set(id, {
                id: p.id,
                userId: p.userId,
                fullName: p.fullName || p.user?.fullName || 'پزشک رادیولوژیست',
                email: p.email || p.user?.email || '',
                specialty: p.specialty || 'متخصص رادیولوژی و تله‌ریپورت',
            });
            if (email)
                seenEmails.add(email);
        }
        for (const u of doctorUsers) {
            const email = (u.email || '').trim().toLowerCase();
            if (!map.has(u.id) && (!email || !seenEmails.has(email))) {
                map.set(u.id, {
                    id: u.id,
                    userId: u.id,
                    fullName: u.fullName || u.email,
                    email: u.email || '',
                    specialty: 'متخصص رادیولوژی و تله‌ریپورت',
                });
                if (email)
                    seenEmails.add(email);
            }
        }
        return Array.from(map.values());
    }
    async detail(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : {
                    OR: [
                        { requestNumber: cleanId },
                        { requestNumber: { equals: cleanId, mode: 'insensitive' } },
                    ],
                },
            include: {
                attachments: true,
                reports: { include: { author: { select: { id: true, fullName: true, email: true } } } },
                infoRequests: true,
            },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const notifications = await this.prisma.telereportNotification.findMany({
            where: { requestId: request.id },
            orderBy: { sentAt: 'desc' },
        });
        return { ...request, notifications };
    }
    async status(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        return this.prisma.teleReportRequest.update({ where: { id: request.id }, data: { status: dto.status } });
    }
    async assignDoctor(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
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
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
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
            // Look up in User table for radiologist role
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
                doctor = await this.prisma.doctorProfile.findUnique({
                    where: { userId: user.id },
                    include: { user: true },
                });
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
        if (!doctor) {
            throw new common_1.NotFoundException('پزشک رادیولوژیست مورد نظر در دیتابیس یافت نشد');
        }
        // Ensure doctor is active and approved for receiving referrals
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
                data: { requestId: request.id, authorId: doctorUserId, status: 'draft', findings: '', conclusion: '' },
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
    async reviewReport(auth, id, dto) {
        const identity = (0, support_auth_1.verifySupportToken)(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const report = await this.prisma.radiologyReport.findUnique({ where: { id: dto.reportId } });
        if (!report || (report.requestId !== request.id && report.requestId !== cleanId)) {
            throw new common_1.BadRequestException('گزارش رادیولوژی یافت نشد');
        }
        const updated = await this.prisma.radiologyReport.update({
            where: { id: dto.reportId },
            data: {
                status: dto.decision,
                signed: dto.decision === 'approved',
                signedAt: dto.decision === 'approved' ? (report.signedAt ?? new Date()) : null,
                rejectReason: dto.decision === 'rejected'
                    ? (dto.rejectReason?.trim() || 'نیاز به بازبینی و اصلاح گزارش توسط پزشک رادیولوژیست')
                    : null,
                reviewedBy: identity.id,
                reviewedAt: new Date(),
            },
            include: { author: { select: { id: true, fullName: true } } },
        });
        await this.prisma.teleReportRequest.update({
            where: { id: request.id },
            data: { status: dto.decision === 'approved' ? 'completed' : 'in_progress' },
        });
        return updated;
    }
    async notify(auth, id, dto) {
        const identity = (0, support_auth_1.verifySupportToken)(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const notification = await this.prisma.telereportNotification.create({
            data: { requestId: request.id, recipient: dto.recipient, message: dto.message, sentBy: identity.id },
        });
        return { ok: true, notification };
    }
    async coordinate(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const cleanId = String(id || '').trim();
        const request = await this.prisma.teleReportRequest.findFirst({
            where: isUuid(cleanId)
                ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
                : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const scheduledDate = (0, tele_report_validation_1.parseOptionalValidDate)(dto.scheduledAt, 'تاریخ زمان‌بندی');
        return this.prisma.teleReportRequest.update({
            where: { id: request.id },
            data: {
                status: 'coordinating',
                ...(dto.notes !== undefined ? { clinicalHistory: `${request.clinicalHistory}\n[پشتیبانی] ${dto.notes}` } : {}),
                ...(scheduledDate ? { studyDate: scheduledDate } : {}),
            },
        });
    }
};
exports.SupportTelereportController = SupportTelereportController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TelereportQueryDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('doctors'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "listDoctors", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, StatusDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "status", null);
__decorate([
    (0, common_1.Patch)(':id/assign-doctor'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, AssignDoctorDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "assignDoctor", null);
__decorate([
    (0, common_1.Patch)(':id/review-report'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ReviewReportDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "reviewReport", null);
__decorate([
    (0, common_1.Post)(':id/notify'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, NotifyDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "notify", null);
__decorate([
    (0, common_1.Patch)(':id/coordinate'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CoordinateDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "coordinate", null);
exports.SupportTelereportController = SupportTelereportController = __decorate([
    (0, common_1.Controller)('support/telereports'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportTelereportController);
