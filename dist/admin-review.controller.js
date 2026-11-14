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
exports.AdminReviewController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const auth_token_1 = require("./auth-token");
class AdminReviewQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewQueryDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewQueryDto.prototype, "limit", void 0);
class UpdateReviewStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReviewStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReviewStatusDto.prototype, "rejectReason", void 0);
let AdminReviewController = class AdminReviewController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recalculateProductReviewStats(productId) {
        const product = await this.prisma.shopProduct.findUnique({ where: { id: productId } });
        if (!product)
            return;
        const approvedReviews = await this.prisma.review.findMany({
            where: {
                targetType: 'product',
                targetId: productId,
                status: 'approved',
            },
            select: { rating: true },
        });
        const reviewCount = approvedReviews.length;
        const avgRating = reviewCount > 0
            ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
            : 0;
        await this.prisma.shopProduct.update({
            where: { id: productId },
            data: {
                reviewCount,
                rating: avgRating,
            },
        });
    }
    async listReviews(authHeader, query) {
        (0, auth_token_1.verifyAdminToken)(authHeader);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all') {
            where.status = query.status;
        }
        if (query.targetType && query.targetType !== 'all') {
            where.targetType = query.targetType;
        }
        if (query.search?.trim()) {
            const s = query.search.trim();
            const matchingProducts = await this.prisma.shopProduct.findMany({
                where: { name: { contains: s, mode: 'insensitive' } },
                select: { id: true },
            });
            const matchingProductIds = matchingProducts.map((p) => p.id);
            where.OR = [
                { content: { contains: s, mode: 'insensitive' } },
                ...(matchingProductIds.length > 0 ? [{ targetId: { in: matchingProductIds } }] : []),
                { user: { fullName: { contains: s, mode: 'insensitive' } } },
                { user: { email: { contains: s, mode: 'insensitive' } } },
            ];
        }
        const [total, items, pendingCount, approvedCount, rejectedCount] = await Promise.all([
            this.prisma.review.count({ where }),
            this.prisma.review.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    reviewer: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            }),
            this.prisma.review.count({ where: { status: 'pending' } }),
            this.prisma.review.count({ where: { status: 'approved' } }),
            this.prisma.review.count({ where: { status: 'rejected' } }),
        ]);
        const productIds = Array.from(new Set(items.filter((r) => r.targetType === 'product' && r.targetId).map((r) => r.targetId)));
        const products = productIds.length > 0
            ? await this.prisma.shopProduct.findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true, slug: true },
            })
            : [];
        const productMap = new Map(products.map((p) => [p.id, p]));
        return {
            items: items.map((r) => {
                const prod = r.targetId ? productMap.get(r.targetId) : undefined;
                const isSupport = r.targetType === 'support' || r.targetId === 'support-center';
                const displayTargetName = isSupport ? 'بخش پشتیبانی رادینت' : (prod?.name || 'محصول');
                return {
                    id: r.id,
                    productId: r.targetId || (isSupport ? 'support-center' : ''),
                    productName: displayTargetName,
                    productSlug: isSupport ? '' : (prod?.slug || ''),
                    userId: r.userId,
                    userName: r.user?.fullName || 'کاربر',
                    userEmail: r.user?.email || '',
                    targetType: r.targetType,
                    targetId: r.targetId,
                    targetName: displayTargetName,
                    rating: r.rating,
                    content: r.content,
                    status: r.status,
                    rejectReason: r.rejectReason,
                    reviewedBy: r.reviewer?.fullName || null,
                    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
                    createdAt: r.createdAt.toISOString(),
                };
            }),
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
            counts: {
                all: pendingCount + approvedCount + rejectedCount,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
            },
        };
    }
    async updateStatus(authHeader, id, dto) {
        const admin = (0, auth_token_1.verifyAdminToken)(authHeader);
        if (!['approved', 'rejected', 'pending'].includes(dto.status)) {
            throw new common_1.BadRequestException('وضعیت نامعتبر است');
        }
        const existing = await this.prisma.review.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('نظر یافت نشد');
        if (dto.status === 'rejected') {
            await this.prisma.review.delete({ where: { id } });
            if (existing.targetType === 'product' && existing.targetId) {
                await this.recalculateProductReviewStats(existing.targetId);
            }
            return {
                id: existing.id,
                status: 'rejected',
                deleted: true,
                rejectReason: dto.rejectReason?.trim() || null,
                reviewedAt: new Date().toISOString(),
            };
        }
        const updated = await this.prisma.review.update({
            where: { id },
            data: {
                status: dto.status,
                rejectReason: null,
                reviewedBy: admin.userId,
                reviewedAt: new Date(),
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });
        if (existing.targetType === 'product' && existing.targetId) {
            await this.recalculateProductReviewStats(existing.targetId);
        }
        return {
            id: updated.id,
            status: updated.status,
            rejectReason: updated.rejectReason,
            reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : null,
        };
    }
    async deleteReview(authHeader, id) {
        (0, auth_token_1.verifyAdminToken)(authHeader);
        const existing = await this.prisma.review.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('نظر یافت نشد');
        await this.prisma.review.delete({ where: { id } });
        if (existing.targetType === 'product' && existing.targetId) {
            await this.recalculateProductReviewStats(existing.targetId);
        }
        return { ok: true };
    }
};
exports.AdminReviewController = AdminReviewController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AdminReviewQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReviewController.prototype, "listReviews", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateReviewStatusDto]),
    __metadata("design:returntype", Promise)
], AdminReviewController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminReviewController.prototype, "deleteReview", null);
exports.AdminReviewController = AdminReviewController = __decorate([
    (0, common_1.Controller)('admin/reviews'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminReviewController);
