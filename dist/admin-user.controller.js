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
exports.AdminUserController = void 0;
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
const ALLOWED_USER_ROLES = [
    'admin',
    'radiologist',
    'doctor',
    'support_expert',
    'SUPPORT_EXPERT',
    'SUPPORT_ADMIN',
    'SUPPORT_AGENT',
    'ORG_ADMIN',
    'ORG_STAFF',
    'RADIANT_AGENCY',
    'AGENCY_MANAGER',
    'user',
    'patient',
];
class CreateUserDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsIn)(ALLOWED_USER_ROLES),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "imagingCenterId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "subSpecialty", void 0);
class UpdateUserDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(ALLOWED_USER_ROLES),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "imagingCenterId", void 0);
class UserQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserQueryDto.prototype, "limit", void 0);
const bcrypt = require('bcryptjs');
let AdminUserController = class AdminUserController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveOrganizationIdForRole(role, providedOrganizationId, fullName, email) {
        if (providedOrganizationId && providedOrganizationId.trim()) {
            return providedOrganizationId.trim();
        }
        if (role !== 'ORG_ADMIN' && role !== 'ORG_STAFF') {
            return null;
        }
        if (role === 'ORG_STAFF') {
            const existingOrg = await this.prisma.organization.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            if (existingOrg)
                return existingOrg.id;
        }
        const createdOrg = await this.prisma.organization.create({
            data: {
                name: `سازمان ${fullName.trim()}`,
                slug: `org-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                type: 'company',
                contactPerson: fullName.trim(),
                contactEmail: email.trim().toLowerCase(),
                email: email.trim().toLowerCase(),
                isActive: true,
            },
        });
        return createdOrg.id;
    }
    async listUsers(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);
        const where = {};
        if (query.role && query.role !== 'all')
            where.role = query.role;
        if (query.country && query.country !== 'all')
            where.country = query.country;
        if (query.status && query.status !== 'all') {
            where.status = query.status;
        }
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { fullName: { contains: value, mode: 'insensitive' } },
                { email: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, users] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    status: true,
                    country: true,
                    organizationId: true,
                    imagingCenterId: true,
                    organization: { select: { id: true, name: true, slug: true } },
                    imagingCenter: { select: { id: true, name: true, slug: true } },
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            reports: true,
                            infoRequests: true,
                        },
                    },
                    doctorProfile: {
                        select: { specialty: true, workplace: true },
                    },
                },
            }),
        ]);
        return {
            items: users,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getUser(auth, id) {
        verifyAdmin(auth);
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                country: true,
                organizationId: true,
                imagingCenterId: true,
                organization: { select: { id: true, name: true, slug: true } },
                imagingCenter: { select: { id: true, name: true, slug: true } },
                createdAt: true,
                updatedAt: true,
                doctorProfile: true,
                _count: {
                    select: {
                        reports: true,
                        infoRequests: true,
                        shopOrders: true,
                        teleReportRequests: true,
                        tickets: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        const [recentReports, recentInfoRequests, recentOrders, recentRequests, recentTickets] = await Promise.all([
            this.prisma.radiologyReport.findMany({
                where: { authorId: id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    status: true,
                    signed: true,
                    createdAt: true,
                    updatedAt: true,
                    request: { select: { requestNumber: true, patientFirstName: true, patientLastName: true } },
                },
            }),
            this.prisma.infoRequest.findMany({
                where: { authorId: id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    createdAt: true,
                    request: { select: { requestNumber: true } },
                },
            }),
            this.prisma.shopOrder.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.teleReportRequest.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    requestNumber: true,
                    imagingType: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.ticket.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    subject: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                },
            }),
        ]);
        return {
            user,
            activity: {
                reports: recentReports,
                infoRequests: recentInfoRequests,
                orders: recentOrders,
                requests: recentRequests,
                tickets: recentTickets,
            },
        };
    }
    async createUser(auth, dto) {
        verifyAdmin(auth);
        const normalizedEmail = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        });
        if (existing)
            throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
        const organizationId = await this.resolveOrganizationIdForRole(dto.role, dto.organizationId, dto.fullName, normalizedEmail);
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName.trim(),
                email: normalizedEmail,
                passwordHash,
                role: dto.role,
                country: dto.country ?? 'IR',
                status: dto.status === 'inactive' || dto.status === 'suspended' ? dto.status : 'active',
                organizationId,
                imagingCenterId: dto.imagingCenterId || null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                country: true,
                status: true,
                organizationId: true,
                imagingCenterId: true,
                createdAt: true,
            },
        });
        if (dto.role === 'radiologist' || dto.role === 'doctor') {
            const specialty = dto.specialty?.trim() || 'متخصص رادیولوژی و تله‌ریپورت';
            const subSpecialty = dto.subSpecialty?.trim() || 'تله‌رادیولوژی بالینی';
            await this.prisma.doctorProfile.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    specialty,
                    subSpecialty,
                    isActive: true,
                    collaborationStatus: 'approved',
                },
                update: {
                    fullName: user.fullName,
                    email: user.email,
                    specialty,
                    subSpecialty,
                    isActive: true,
                    collaborationStatus: 'approved',
                },
            });
        }
        return user;
    }
    async updateUser(auth, id, dto) {
        verifyAdmin(auth);
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        const data = {};
        if (dto.fullName !== undefined)
            data.fullName = dto.fullName.trim();
        if (dto.email !== undefined) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            const emailExists = await this.prisma.user.findFirst({
                where: { email: { equals: normalizedEmail, mode: 'insensitive' }, id: { not: id } },
            });
            if (emailExists)
                throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
            data.email = normalizedEmail;
        }
        if (dto.password !== undefined && dto.password.trim()) {
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.country !== undefined)
            data.country = dto.country;
        if (dto.status !== undefined)
            data.status = dto.status;
        const targetRole = dto.role ?? user.role;
        if (dto.organizationId !== undefined) {
            data.organizationId = dto.organizationId || null;
        }
        else if ((targetRole === 'ORG_ADMIN' || targetRole === 'ORG_STAFF') && !user.organizationId) {
            data.organizationId = await this.resolveOrganizationIdForRole(targetRole, null, (dto.fullName ?? user.fullName).trim(), user.email);
        }
        if (dto.imagingCenterId !== undefined)
            data.imagingCenterId = dto.imagingCenterId || null;
        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                country: true,
                status: true,
                organizationId: true,
                imagingCenterId: true,
                updatedAt: true,
            },
        });
    }
    async deleteUser(auth, id) {
        const admin = verifyAdmin(auth);
        if (admin.sub === id) {
            throw new common_1.BadRequestException('امکان حذف حساب کاربری مدیر جاری وجود ندارد');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        await this.prisma.$transaction(async (tx) => {
            // Disconnect assigned tickets and chat sessions
            await tx.ticket.updateMany({ where: { assignedTo: id }, data: { assignedTo: null } });
            await tx.chatSession.updateMany({ where: { expertId: id }, data: { expertId: null } });
            // Set author to null on reports and info requests if authorId is nullable
            await tx.radiologyReport.updateMany({ where: { authorId: id }, data: { authorId: null } });
            await tx.infoRequest.updateMany({ where: { authorId: id }, data: { authorId: null } });
            // Delete user
            await tx.user.delete({ where: { id } });
        });
        return { ok: true };
    }
};
exports.AdminUserController = AdminUserController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UserQueryDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "deleteUser", null);
exports.AdminUserController = AdminUserController = __decorate([
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUserController);
