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
exports.AdminDoctorController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const bcrypt = __importStar(require("bcryptjs"));
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
class DoctorQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DoctorQueryDto.prototype, "limit", void 0);
class CreateDoctorDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "subSpecialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "workplace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateDoctorDto.prototype, "maxDailyReports", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDoctorDto.prototype, "tariff", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDoctorDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['approved', 'pending', 'rejected']),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "collaborationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "biography", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "education", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "certifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "languages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDoctorDto.prototype, "experienceYears", void 0);
class UpdateDoctorDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "subSpecialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "workplace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateDoctorDto.prototype, "maxDailyReports", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDoctorDto.prototype, "tariff", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDoctorDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['approved', 'pending', 'rejected']),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "collaborationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "biography", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "education", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "certifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDoctorDto.prototype, "languages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDoctorDto.prototype, "experienceYears", void 0);
let AdminDoctorController = class AdminDoctorController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listDoctors(auth, query) {
        verifyAdmin(auth);
        try {
            const missingProfiles = await this.prisma.user.findMany({
                where: {
                    role: { in: ['radiologist', 'doctor'] },
                    doctorProfile: null,
                },
            });
            for (const u of missingProfiles) {
                await this.prisma.doctorProfile.create({
                    data: {
                        userId: u.id,
                        fullName: u.fullName || u.email,
                        email: u.email,
                        specialty: 'متخصص رادیولوژی',
                        isActive: u.status !== 'inactive' && u.status !== 'suspended',
                        collaborationStatus: 'approved',
                    },
                }).catch(() => { });
            }
        }
        catch {
            // ignore
        }
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);
        const where = {};
        if (query.status && query.status !== 'all') {
            if (query.status === 'approved')
                where.collaborationStatus = 'approved';
            else if (query.status === 'pending')
                where.collaborationStatus = 'pending';
            else if (query.status === 'rejected')
                where.collaborationStatus = 'rejected';
            else if (query.status === 'active')
                where.isActive = true;
            else if (query.status === 'inactive')
                where.isActive = false;
        }
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { fullName: { contains: value, mode: 'insensitive' } },
                { email: { contains: value, mode: 'insensitive' } },
                { specialty: { contains: value, mode: 'insensitive' } },
                { workplace: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, doctors] = await Promise.all([
            this.prisma.doctorProfile.count({ where }),
            this.prisma.doctorProfile.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    userId: true,
                    fullName: true,
                    email: true,
                    specialty: true,
                    subSpecialty: true,
                    licenseNumber: true,
                    workplace: true,
                    experienceYears: true,
                    maxDailyReports: true,
                    tariff: true,
                    isActive: true,
                    collaborationStatus: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: { id: true, role: true, status: true, country: true },
                    },
                },
            }),
        ]);
        const doctorsWithStats = await Promise.all(doctors.map(async (doc) => {
            const reportCount = await this.prisma.radiologyReport.count({
                where: { authorId: doc.userId },
            });
            const signedCount = await this.prisma.radiologyReport.count({
                where: { authorId: doc.userId, signed: true },
            });
            const completedCount = await this.prisma.radiologyReport.count({
                where: { authorId: doc.userId, status: 'final' },
            });
            const recentReports = await this.prisma.radiologyReport.findMany({
                where: { authorId: doc.userId, signedAt: { not: null } },
                orderBy: { signedAt: 'desc' },
                take: 20,
                select: { signedAt: true, createdAt: true },
            });
            let avgResponseHours = null;
            if (recentReports.length > 0) {
                const totalHours = recentReports.reduce((sum, r) => {
                    if (r.signedAt && r.createdAt) {
                        return sum + (r.signedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
                    }
                    return sum;
                }, 0);
                avgResponseHours = totalHours / recentReports.length;
            }
            return {
                ...doc,
                stats: {
                    totalReports: reportCount,
                    signedReports: signedCount,
                    completedReports: completedCount,
                    avgResponseHours: avgResponseHours !== null ? Math.round(avgResponseHours * 10) / 10 : null,
                },
            };
        }));
        return {
            items: doctorsWithStats,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getDoctor(auth, id) {
        verifyAdmin(auth);
        const doctor = await this.prisma.doctorProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, role: true, status: true, country: true, email: true, fullName: true },
                },
            },
        });
        if (!doctor)
            throw new common_1.NotFoundException('پزشک یافت نشد');
        const reports = await this.prisma.radiologyReport.findMany({
            where: { authorId: doctor.userId },
            orderBy: { createdAt: 'desc' },
            take: 15,
            select: {
                id: true,
                status: true,
                signed: true,
                createdAt: true,
                updatedAt: true,
                signedAt: true,
                request: { select: { requestNumber: true, patientFirstName: true, patientLastName: true, imagingType: true } },
            },
        });
        const totalReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId } });
        const signedReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId, signed: true } });
        const completedReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId, status: 'final' } });
        const infoRequestCount = await this.prisma.infoRequest.count({ where: { authorId: doctor.userId } });
        return {
            doctor,
            stats: {
                totalReports,
                signedReports,
                completedReports,
                infoRequests: infoRequestCount,
            },
            recentReports: reports,
        };
    }
    async createDoctor(auth, dto) {
        verifyAdmin(auth);
        if (!dto.fullName?.trim()) {
            throw new common_1.BadRequestException('نام و نام خانوادگی پزشک الزامی است');
        }
        const email = (dto.email?.trim() || `doc_${Date.now()}@radinet.ir`).toLowerCase();
        // Check if user already exists
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const passwordHash = await bcrypt.hash('RadinetDoctor123!', 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    fullName: dto.fullName.trim(),
                    role: 'radiologist',
                    status: dto.isActive !== false ? 'active' : 'inactive',
                    country: 'IR',
                    passwordHash,
                },
            });
        }
        else {
            // Ensure user has radiologist role and active status if specified
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    fullName: dto.fullName.trim(),
                    role: 'radiologist',
                    status: dto.isActive !== false ? 'active' : user.status,
                },
            });
        }
        // Check if doctor profile already exists for this user
        let profile = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
        if (profile) {
            profile = await this.prisma.doctorProfile.update({
                where: { id: profile.id },
                data: {
                    fullName: dto.fullName.trim(),
                    email,
                    specialty: dto.specialty?.trim() || profile.specialty || 'متخصص رادیولوژی و تله‌ریپورت',
                    subSpecialty: dto.subSpecialty !== undefined ? dto.subSpecialty?.trim() || null : profile.subSpecialty,
                    licenseNumber: dto.licenseNumber !== undefined ? dto.licenseNumber?.trim() || null : profile.licenseNumber,
                    workplace: dto.workplace?.trim() || profile.workplace || 'مرکز تله‌رادیولوژی رادینت',
                    experienceYears: dto.experienceYears ?? profile.experienceYears ?? 5,
                    maxDailyReports: dto.maxDailyReports ?? profile.maxDailyReports ?? 20,
                    tariff: dto.tariff ?? profile.tariff ?? 950000,
                    isActive: dto.isActive !== undefined ? dto.isActive : profile.isActive,
                    collaborationStatus: dto.collaborationStatus || profile.collaborationStatus || 'approved',
                    biography: dto.biography !== undefined ? dto.biography : profile.biography,
                    education: dto.education !== undefined ? dto.education : profile.education,
                    certifications: dto.certifications !== undefined ? dto.certifications : profile.certifications,
                    languages: dto.languages !== undefined ? dto.languages : profile.languages,
                },
            });
        }
        else {
            profile = await this.prisma.doctorProfile.create({
                data: {
                    userId: user.id,
                    fullName: dto.fullName.trim(),
                    email,
                    specialty: dto.specialty?.trim() || 'متخصص رادیولوژی و تله‌ریپورت',
                    subSpecialty: dto.subSpecialty?.trim() || null,
                    licenseNumber: dto.licenseNumber?.trim() || null,
                    workplace: dto.workplace?.trim() || 'مرکز تله‌رادیولوژی رادینت',
                    experienceYears: dto.experienceYears ?? 5,
                    maxDailyReports: dto.maxDailyReports ?? 20,
                    tariff: dto.tariff ?? 950000,
                    isActive: dto.isActive !== false,
                    collaborationStatus: dto.collaborationStatus || 'approved',
                    biography: dto.biography?.trim() || '',
                    education: dto.education?.trim() || '',
                    certifications: dto.certifications?.trim() || '',
                    languages: dto.languages?.trim() || 'فارسی',
                },
            });
        }
        return {
            ...profile,
            user: { id: user.id, role: user.role, status: user.status, country: user.country },
            stats: { totalReports: 0, signedReports: 0, completedReports: 0, avgResponseHours: null },
        };
    }
    async updateDoctor(auth, id, dto) {
        verifyAdmin(auth);
        const cleanId = id.startsWith('doc-') ? id.replace('doc-', '') : id;
        const doctor = await this.prisma.doctorProfile.findFirst({
            where: { OR: [{ id }, { id: cleanId }, { userId: id }, { userId: cleanId }] },
            include: { user: true },
        });
        if (!doctor)
            throw new common_1.NotFoundException('پزشک یافت نشد');
        const data = {};
        if (dto.fullName !== undefined)
            data.fullName = dto.fullName.trim();
        if (dto.email !== undefined)
            data.email = dto.email.trim().toLowerCase();
        if (dto.specialty !== undefined)
            data.specialty = dto.specialty;
        if (dto.subSpecialty !== undefined)
            data.subSpecialty = dto.subSpecialty;
        if (dto.licenseNumber !== undefined)
            data.licenseNumber = dto.licenseNumber;
        if (dto.workplace !== undefined)
            data.workplace = dto.workplace;
        if (dto.maxDailyReports !== undefined)
            data.maxDailyReports = dto.maxDailyReports;
        if (dto.tariff !== undefined)
            data.tariff = dto.tariff;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.collaborationStatus !== undefined)
            data.collaborationStatus = dto.collaborationStatus;
        if (dto.biography !== undefined)
            data.biography = dto.biography;
        if (dto.education !== undefined)
            data.education = dto.education;
        if (dto.certifications !== undefined)
            data.certifications = dto.certifications;
        if (dto.languages !== undefined)
            data.languages = dto.languages;
        if (dto.experienceYears !== undefined)
            data.experienceYears = dto.experienceYears;
        // Update associated User table if name, email or active status changed
        if (dto.fullName !== undefined || dto.email !== undefined || dto.isActive !== undefined) {
            await this.prisma.user.update({
                where: { id: doctor.userId },
                data: {
                    ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
                    ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
                    ...(dto.isActive !== undefined ? { status: dto.isActive ? 'active' : 'inactive' } : {}),
                },
            }).catch(() => { });
        }
        return this.prisma.doctorProfile.update({
            where: { id: doctor.id },
            data,
            select: {
                id: true,
                userId: true,
                fullName: true,
                email: true,
                specialty: true,
                subSpecialty: true,
                licenseNumber: true,
                workplace: true,
                experienceYears: true,
                biography: true,
                education: true,
                certifications: true,
                languages: true,
                maxDailyReports: true,
                tariff: true,
                isActive: true,
                collaborationStatus: true,
                updatedAt: true,
            },
        });
    }
    async approveDoctor(auth, id) {
        verifyAdmin(auth);
        const cleanId = id.startsWith('doc-') ? id.replace('doc-', '') : id;
        const doctor = await this.prisma.doctorProfile.findFirst({
            where: { OR: [{ id }, { id: cleanId }, { userId: id }, { userId: cleanId }] },
        });
        if (!doctor)
            throw new common_1.NotFoundException('پزشک یافت نشد');
        await this.prisma.user.update({
            where: { id: doctor.userId },
            data: { status: 'active' },
        }).catch(() => { });
        return this.prisma.doctorProfile.update({
            where: { id: doctor.id },
            data: { collaborationStatus: 'approved', isActive: true },
            select: {
                id: true,
                userId: true,
                fullName: true,
                collaborationStatus: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
    async rejectDoctor(auth, id) {
        verifyAdmin(auth);
        const cleanId = id.startsWith('doc-') ? id.replace('doc-', '') : id;
        const doctor = await this.prisma.doctorProfile.findFirst({
            where: { OR: [{ id }, { id: cleanId }, { userId: id }, { userId: cleanId }] },
        });
        if (!doctor)
            throw new common_1.NotFoundException('پزشک یافت نشد');
        return this.prisma.doctorProfile.update({
            where: { id: doctor.id },
            data: { collaborationStatus: 'rejected', isActive: false },
            select: {
                id: true,
                userId: true,
                fullName: true,
                collaborationStatus: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
    async deleteDoctor(auth, id) {
        verifyAdmin(auth);
        const cleanId = id.startsWith('doc-') ? id.replace('doc-', '') : id;
        const doctor = await this.prisma.doctorProfile.findFirst({
            where: { OR: [{ id }, { id: cleanId }, { userId: id }, { userId: cleanId }] },
        });
        if (!doctor)
            throw new common_1.NotFoundException('پزشک یافت نشد');
        await this.prisma.$transaction(async (tx) => {
            // 1. Unassign from teleReportRequests safely without losing the patient requests
            await tx.teleReportRequest.updateMany({
                where: { assignedDoctorId: doctor.userId },
                data: { assignedDoctorId: null, status: 'new' },
            });
            // 2. In radiologyReport, disassociate author without deleting the medical reports or records
            await tx.radiologyReport.updateMany({
                where: { authorId: doctor.userId },
                data: { authorId: null },
            });
            // 3. Clear routing rules preferred doctor
            await tx.routingRule.updateMany({
                where: { preferredDoctorId: doctor.id },
                data: { preferredDoctorId: null },
            });
            // 4. In infoRequest disassociate author
            await tx.infoRequest.updateMany({
                where: { authorId: doctor.userId },
                data: { authorId: null },
            });
            // 5. Delete doctor profile
            await tx.doctorProfile.delete({ where: { id: doctor.id } });
            // 6. Demote user role or keep user account intact - DO NOT DELETE USER
            await tx.user.update({
                where: { id: doctor.userId },
                data: { role: 'user' },
            }).catch(() => { });
        });
        return { ok: true, message: 'پزشک رادیولوژیست با موفقیت حذف شد' };
    }
};
exports.AdminDoctorController = AdminDoctorController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DoctorQueryDto]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "listDoctors", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "getDoctor", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateDoctorDto]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "createDoctor", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateDoctorDto]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "updateDoctor", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "approveDoctor", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "rejectDoctor", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDoctorController.prototype, "deleteDoctor", null);
exports.AdminDoctorController = AdminDoctorController = __decorate([
    (0, common_1.Controller)('admin/doctors'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDoctorController);
