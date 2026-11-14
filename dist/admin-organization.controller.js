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
exports.AdminOrganizationController = void 0;
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
class CreateOrganizationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "economicCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOrganizationDto.prototype, "isActive", void 0);
class UpdateOrganizationDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "economicCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrganizationDto.prototype, "isActive", void 0);
class OrganizationQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationQueryDto.prototype, "limit", void 0);
class CreateContractDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "centerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateContractDto.prototype, "contractNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "terms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateContractDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateContractDto.prototype, "creditLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "signedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "signedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContractDto.prototype, "notes", void 0);
class UpdateContractDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "centerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "terms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateContractDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateContractDto.prototype, "creditLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "signedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "signedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContractDto.prototype, "notes", void 0);
let AdminOrganizationController = class AdminOrganizationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listOrganizations(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);
        const where = {};
        if (query.status === 'active')
            where.isActive = true;
        else if (query.status === 'inactive')
            where.isActive = false;
        if (query.type && query.type !== 'all')
            where.type = query.type;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { name: { contains: value, mode: 'insensitive' } },
                { slug: { contains: value, mode: 'insensitive' } },
                { nationalId: { contains: value, mode: 'insensitive' } },
                { economicCode: { contains: value, mode: 'insensitive' } },
                { contactPerson: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, orgs] = await Promise.all([
            this.prisma.organization.count({ where }),
            this.prisma.organization.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { contracts: true } },
                },
            }),
        ]);
        return {
            items: orgs,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getOrganization(auth, id) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                contracts: {
                    include: {
                        center: { select: { id: true, name: true, slug: true } },
                    },
                },
                users: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        createdAt: true,
                    },
                },
                _count: { select: { contracts: true, users: true } },
            },
        });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        return org;
    }
    async createOrganization(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
        return this.prisma.organization.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                type: dto.type ?? 'company',
                description: dto.description ?? '',
                address: dto.address ?? '',
                phone: dto.phone ?? '',
                email: dto.email ?? '',
                city: dto.city ?? '',
                province: dto.province ?? '',
                nationalId: dto.nationalId,
                economicCode: dto.economicCode,
                registrationNumber: dto.registrationNumber,
                contactPerson: dto.contactPerson,
                contactPhone: dto.contactPhone,
                contactEmail: dto.contactEmail,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateOrganization(auth, id, dto) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        if (dto.slug && dto.slug !== org.slug) {
            const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
        }
        return this.prisma.organization.update({
            where: { id },
            data: dto,
        });
    }
    async deleteOrganization(auth, id) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        await this.prisma.organization.delete({ where: { id } });
        return { ok: true };
    }
    // ── Contracts ──
    async listContracts(auth, id) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        return this.prisma.organizationContract.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                center: { select: { id: true, name: true, slug: true } },
            },
        });
    }
    async createContract(auth, id, dto) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        const existingContract = await this.prisma.organizationContract.findUnique({
            where: { contractNumber: dto.contractNumber },
        });
        if (existingContract)
            throw new common_1.BadRequestException('شماره قرارداد تکراری است');
        return this.prisma.organizationContract.create({
            data: {
                organizationId: id,
                centerId: dto.centerId,
                contractNumber: dto.contractNumber,
                title: dto.title,
                type: dto.type ?? 'service',
                status: dto.status ?? 'active',
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                terms: dto.terms ?? '',
                discountPercent: dto.discountPercent ?? 0,
                creditLimit: dto.creditLimit,
                signedBy: dto.signedBy,
                signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
                notes: dto.notes,
            },
            include: {
                organization: { select: { id: true, name: true } },
                center: { select: { id: true, name: true } },
            },
        });
    }
    async updateContract(auth, id, contractId, dto) {
        verifyAdmin(auth);
        const contract = await this.prisma.organizationContract.findUnique({
            where: { id: contractId },
        });
        if (!contract)
            throw new common_1.NotFoundException('قرارداد یافت نشد');
        if (contract.organizationId !== id)
            throw new common_1.BadRequestException('قرارداد متعلق به این سازمان نیست');
        const data = {};
        if (dto.centerId !== undefined)
            data.centerId = dto.centerId;
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.startDate !== undefined)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            data.endDate = dto.endDate ? new Date(dto.endDate) : null;
        if (dto.terms !== undefined)
            data.terms = dto.terms;
        if (dto.discountPercent !== undefined)
            data.discountPercent = dto.discountPercent;
        if (dto.creditLimit !== undefined)
            data.creditLimit = dto.creditLimit;
        if (dto.signedBy !== undefined)
            data.signedBy = dto.signedBy;
        if (dto.signedAt !== undefined)
            data.signedAt = dto.signedAt ? new Date(dto.signedAt) : null;
        if (dto.notes !== undefined)
            data.notes = dto.notes;
        return this.prisma.organizationContract.update({
            where: { id: contractId },
            data,
            include: {
                organization: { select: { id: true, name: true } },
                center: { select: { id: true, name: true } },
            },
        });
    }
    async deleteContract(auth, id, contractId) {
        verifyAdmin(auth);
        const contract = await this.prisma.organizationContract.findUnique({
            where: { id: contractId },
        });
        if (!contract)
            throw new common_1.NotFoundException('قرارداد یافت نشد');
        if (contract.organizationId !== id)
            throw new common_1.BadRequestException('قرارداد متعلق به این سازمان نیست');
        await this.prisma.organizationContract.delete({ where: { id: contractId } });
        return { ok: true };
    }
    // ── Organization Users ──
    async listOrgUsers(auth, id) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        return this.prisma.user.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: 'desc' },
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
        });
    }
    async assignUserToOrg(auth, id, userId, body) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        const data = { organizationId: id };
        if (body.role && ['ORG_ADMIN', 'ORG_STAFF', 'user'].includes(body.role)) {
            data.role = body.role;
        }
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                organizationId: true,
            },
        });
    }
    async removeUserFromOrg(auth, id, userId) {
        verifyAdmin(auth);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        if (user.organizationId !== id)
            throw new common_1.BadRequestException('این کاربر به این سازمان متصل نیست');
        return this.prisma.user.update({
            where: { id: userId },
            data: { organizationId: null },
            select: { id: true, fullName: true, organizationId: true },
        });
    }
    // ── Aggregated Requests Report (گزارش تجمیعی درخواست‌های سازمان) ──
    async getOrganizationRequestsReport(auth, id) {
        verifyAdmin(auth);
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                users: { select: { id: true, fullName: true, email: true } },
            },
        });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        const userIds = org.users.map((u) => u.id);
        const where = {
            userId: { in: userIds },
        };
        const [totalRequests, newCount, assignedCount, inProgressCount, completedCount, cancelledCount, requests,] = await Promise.all([
            this.prisma.teleReportRequest.count({ where }),
            this.prisma.teleReportRequest.count({ where: { ...where, status: 'new' } }),
            this.prisma.teleReportRequest.count({ where: { ...where, status: 'assigned' } }),
            this.prisma.teleReportRequest.count({ where: { ...where, status: 'in_progress' } }),
            this.prisma.teleReportRequest.count({ where: { ...where, status: 'completed' } }),
            this.prisma.teleReportRequest.count({ where: { ...where, status: 'cancelled' } }),
            this.prisma.teleReportRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    reports: {
                        select: {
                            id: true,
                            status: true,
                            signed: true,
                            author: { select: { fullName: true } },
                        },
                    },
                },
            }),
        ]);
        // Group by imagingType
        const byImagingType = {};
        for (const r of requests) {
            const type = r.imagingType || 'نامشخص';
            byImagingType[type] = (byImagingType[type] ?? 0) + 1;
        }
        return {
            organization: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                type: org.type,
                userCount: org.users.length,
            },
            summary: {
                total: totalRequests,
                byStatus: {
                    new: newCount,
                    assigned: assignedCount,
                    in_progress: inProgressCount,
                    completed: completedCount,
                    cancelled: cancelledCount,
                },
                byImagingType,
            },
            requests: requests.map((r) => ({
                id: r.id,
                requestNumber: r.requestNumber,
                patientName: `${r.patientFirstName} ${r.patientLastName}`.trim(),
                nationalId: r.nationalId,
                phone: r.phone,
                imagingType: r.imagingType,
                imagingArea: r.imagingArea,
                status: r.status,
                createdAt: r.createdAt,
                submittedBy: r.user?.fullName ?? r.user?.email ?? '—',
                doctorName: r.reports?.[0]?.author?.fullName ?? 'تعیین نشده',
                reportStatus: r.reports?.[0]?.status ?? 'بدون گزارش',
            })),
        };
    }
};
exports.AdminOrganizationController = AdminOrganizationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, OrganizationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "listOrganizations", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "getOrganization", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateOrganizationDto]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "createOrganization", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateOrganizationDto]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "updateOrganization", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "deleteOrganization", null);
__decorate([
    (0, common_1.Get)(':id/contracts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "listContracts", null);
__decorate([
    (0, common_1.Post)(':id/contracts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CreateContractDto]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "createContract", null);
__decorate([
    (0, common_1.Patch)(':id/contracts/:contractId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('contractId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, UpdateContractDto]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "updateContract", null);
__decorate([
    (0, common_1.Delete)(':id/contracts/:contractId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "deleteContract", null);
__decorate([
    (0, common_1.Get)(':id/users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "listOrgUsers", null);
__decorate([
    (0, common_1.Patch)(':id/users/:userId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "assignUserToOrg", null);
__decorate([
    (0, common_1.Delete)(':id/users/:userId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "removeUserFromOrg", null);
__decorate([
    (0, common_1.Get)(':id/requests-report'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminOrganizationController.prototype, "getOrganizationRequestsReport", null);
exports.AdminOrganizationController = AdminOrganizationController = __decorate([
    (0, common_1.Controller)('admin/organizations'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminOrganizationController);
