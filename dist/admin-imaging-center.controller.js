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
exports.AdminImagingCenterController = void 0;
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
class CreateImagingCenterDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImagingCenterDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImagingCenterDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateImagingCenterDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateImagingCenterDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImagingCenterDto.prototype, "displayOrder", void 0);
class UpdateImagingCenterDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateImagingCenterDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateImagingCenterDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImagingCenterDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateImagingCenterDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateImagingCenterDto.prototype, "displayOrder", void 0);
class CenterQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CenterQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CenterQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CenterQueryDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CenterQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CenterQueryDto.prototype, "limit", void 0);
let AdminImagingCenterController = class AdminImagingCenterController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCenters(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);
        const where = {};
        if (query.status === 'active')
            where.isActive = true;
        else if (query.status === 'inactive')
            where.isActive = false;
        if (query.city && query.city !== 'all')
            where.city = query.city;
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { name: { contains: value, mode: 'insensitive' } },
                { slug: { contains: value, mode: 'insensitive' } },
                { city: { contains: value, mode: 'insensitive' } },
                { licenseNumber: { contains: value, mode: 'insensitive' } },
            ];
        }
        const [total, centers] = await Promise.all([
            this.prisma.imagingCenter.count({ where }),
            this.prisma.imagingCenter.findMany({
                where,
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { users: true, contracts: true } },
                },
            }),
        ]);
        const centersWithStats = await Promise.all(centers.map(async (center) => {
            const [orders, requests] = await Promise.all([
                this.prisma.shopOrder.count({
                    where: { customerPhone: center.phone },
                }),
                this.prisma.teleReportRequest.count({
                    where: { phone: center.phone },
                }),
            ]);
            return {
                ...center,
                stats: { orders, requests },
            };
        }));
        return {
            items: centersWithStats,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getCenter(auth, id) {
        verifyAdmin(auth);
        const center = await this.prisma.imagingCenter.findUnique({
            where: { id },
            include: {
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
                contracts: {
                    include: {
                        organization: { select: { id: true, name: true, slug: true } },
                    },
                },
                _count: { select: { users: true, contracts: true } },
            },
        });
        if (!center)
            throw new common_1.NotFoundException('مرکز تصویربرداری یافت نشد');
        const recentOrders = await this.prisma.shopOrder.findMany({
            where: { customerPhone: center.phone },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                total: true,
                status: true,
                createdAt: true,
            },
        });
        const recentRequests = await this.prisma.teleReportRequest.findMany({
            where: { phone: center.phone },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                requestNumber: true,
                patientFirstName: true,
                patientLastName: true,
                imagingType: true,
                status: true,
                createdAt: true,
            },
        });
        return {
            center,
            activity: {
                orders: recentOrders,
                requests: recentRequests,
            },
        };
    }
    async createCenter(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.imagingCenter.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
        return this.prisma.imagingCenter.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description ?? '',
                address: dto.address ?? '',
                phone: dto.phone ?? '',
                email: dto.email ?? '',
                city: dto.city ?? '',
                province: dto.province ?? '',
                latitude: dto.latitude,
                longitude: dto.longitude,
                logoUrl: dto.logoUrl,
                licenseNumber: dto.licenseNumber,
                contactPerson: dto.contactPerson,
                contactPhone: dto.contactPhone,
                isActive: dto.isActive ?? true,
                displayOrder: dto.displayOrder ?? 0,
            },
        });
    }
    async updateCenter(auth, id, dto) {
        verifyAdmin(auth);
        const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
        if (!center)
            throw new common_1.NotFoundException('مرکز تصویربرداری یافت نشد');
        if (dto.slug && dto.slug !== center.slug) {
            const existing = await this.prisma.imagingCenter.findUnique({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
        }
        return this.prisma.imagingCenter.update({
            where: { id },
            data: dto,
        });
    }
    async deleteCenter(auth, id) {
        verifyAdmin(auth);
        const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
        if (!center)
            throw new common_1.NotFoundException('مرکز تصویربرداری یافت نشد');
        await this.prisma.imagingCenter.delete({ where: { id } });
        return { ok: true };
    }
    async listCenterUsers(auth, id) {
        verifyAdmin(auth);
        const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
        if (!center)
            throw new common_1.NotFoundException('مرکز تصویربرداری یافت نشد');
        return this.prisma.user.findMany({
            where: { imagingCenterId: id },
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
    async assignUserToCenter(auth, id, userId) {
        verifyAdmin(auth);
        const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
        if (!center)
            throw new common_1.NotFoundException('مرکز تصویربرداری یافت نشد');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        return this.prisma.user.update({
            where: { id: userId },
            data: { imagingCenterId: id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                imagingCenterId: true,
            },
        });
    }
    async removeUserFromCenter(auth, id, userId) {
        verifyAdmin(auth);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        if (user.imagingCenterId !== id)
            throw new common_1.BadRequestException('این کاربر به این مرکز متصل نیست');
        return this.prisma.user.update({
            where: { id: userId },
            data: { imagingCenterId: null },
            select: { id: true, fullName: true, imagingCenterId: true },
        });
    }
};
exports.AdminImagingCenterController = AdminImagingCenterController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CenterQueryDto]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "listCenters", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "getCenter", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateImagingCenterDto]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "createCenter", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateImagingCenterDto]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "updateCenter", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "deleteCenter", null);
__decorate([
    (0, common_1.Get)(':id/users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "listCenterUsers", null);
__decorate([
    (0, common_1.Patch)(':id/users/:userId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "assignUserToCenter", null);
__decorate([
    (0, common_1.Delete)(':id/users/:userId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminImagingCenterController.prototype, "removeUserFromCenter", null);
exports.AdminImagingCenterController = AdminImagingCenterController = __decorate([
    (0, common_1.Controller)('admin/imaging-centers'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminImagingCenterController);
