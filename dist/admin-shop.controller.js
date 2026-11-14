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
exports.AdminShopController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const multipart_upload_1 = require("./multipart-upload");
const prisma_service_1 = require("./prisma.service");
const auth_token_1 = require("./auth-token");
const shop_rules_1 = require("./shop-rules");
function verifyAdmin(auth) {
    return (0, auth_token_1.verifyAdminToken)(auth);
}
// ── Category DTOs ──
class CreateCategoryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "heroImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "colorTheme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCategoryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "displayOrder", void 0);
class UpdateCategoryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "heroImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "colorTheme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCategoryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateCategoryDto.prototype, "displayOrder", void 0);
// ── Product DTOs ──
class CreateProductDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateProductDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "shortDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "technicalSpecifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "oldPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "maxOrderQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isFeatured", void 0);
class UpdateProductDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "shortDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "technicalSpecifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "oldPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "maxOrderQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isFeatured", void 0);
class ProductQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "categorySlug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "sort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductQueryDto.prototype, "limit", void 0);
// ── Discount DTOs ──
class CreateDiscountDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateDiscountDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiscountDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiscountDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDiscountDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiscountDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiscountDto.prototype, "maxDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateDiscountDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDiscountDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDiscountDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDiscountDto.prototype, "isActive", void 0);
class UpdateDiscountDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDiscountDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDiscountDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDiscountDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDiscountDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDiscountDto.prototype, "maxDiscountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateDiscountDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDiscountDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDiscountDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDiscountDto.prototype, "isActive", void 0);
let AdminShopController = class AdminShopController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Categories ──
    async listCategories(auth) {
        verifyAdmin(auth);
        return this.prisma.shopCategory.findMany({
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            include: {
                _count: { select: { products: true } },
                parent: { select: { id: true, name: true } },
            },
        });
    }
    async createCategory(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.shopCategory.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.BadRequestException('این slug قبلاً ثبت شده است');
        return this.prisma.shopCategory.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description ?? '',
                imageUrl: dto.imageUrl ?? '',
                heroImageUrl: dto.heroImageUrl ?? '',
                aboutTitle: dto.aboutTitle ?? 'درباره این دسته‌بندی',
                aboutDescription: dto.aboutDescription ?? '',
                aboutImageUrl: dto.aboutImageUrl ?? '',
                iconKey: dto.iconKey ?? 'imaging-equipment',
                colorTheme: dto.colorTheme ?? 'blue',
                parentId: dto.parentId,
                isActive: dto.isActive ?? true,
                displayOrder: dto.displayOrder ?? 0,
            },
            include: { children: true, parent: true },
        });
    }
    async updateCategory(auth, id, dto) {
        verifyAdmin(auth);
        const category = await this.prisma.shopCategory.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('دسته‌بندی یافت نشد');
        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.prisma.shopCategory.findUnique({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException('این slug قبلاً ثبت شده است');
        }
        return this.prisma.shopCategory.update({
            where: { id },
            data: dto,
            include: { children: true, parent: true },
        });
    }
    async deleteCategory(auth, id) {
        verifyAdmin(auth);
        const category = await this.prisma.shopCategory.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('دسته‌بندی یافت نشد');
        const productCount = await this.prisma.shopProduct.count({ where: { categoryId: id } });
        if (productCount > 0)
            throw new common_1.BadRequestException('این دسته‌بندی دارای محصول است و قابل حذف نیست');
        await this.prisma.shopCategory.delete({ where: { id } });
        return { ok: true };
    }
    // ── Products ──
    async listProducts(auth, query) {
        verifyAdmin(auth);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status === 'active')
            where.isActive = true;
        else if (query.status === 'inactive')
            where.isActive = false;
        if (query.categorySlug) {
            const cat = await this.prisma.shopCategory.findUnique({ where: { slug: query.categorySlug } });
            if (cat)
                where.categoryId = cat.id;
        }
        if (query.search?.trim()) {
            const value = query.search.trim();
            where.OR = [
                { name: { contains: value, mode: 'insensitive' } },
                { slug: { contains: value, mode: 'insensitive' } },
                { brand: { contains: value, mode: 'insensitive' } },
                { sku: { contains: value, mode: 'insensitive' } },
            ];
        }
        const order = {};
        if (query.sort === 'price-asc')
            order.price = 'asc';
        else if (query.sort === 'price-desc')
            order.price = 'desc';
        else if (query.sort === 'stock-asc')
            order.stock = 'asc';
        else if (query.sort === 'stock-desc')
            order.stock = 'desc';
        else if (query.sort === 'sales')
            order.salesCount = 'desc';
        else
            order.createdAt = 'desc';
        const [total, products] = await Promise.all([
            this.prisma.shopProduct.count({ where }),
            this.prisma.shopProduct.findMany({
                where,
                orderBy: order,
                skip: (page - 1) * limit,
                take: limit,
                include: { category: true },
            }),
        ]);
        return {
            items: products,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
        };
    }
    async getProduct(auth, id) {
        verifyAdmin(auth);
        const product = await this.prisma.shopProduct.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('محصول یافت نشد');
        return product;
    }
    async uploadProductImage(auth, file) {
        verifyAdmin(auth);
        const validation = (0, shop_rules_1.validateProductImageFile)(file);
        if (!validation.valid || !file?.buffer) {
            throw new common_1.BadRequestException(validation.message ?? 'فایل تصویر نامعتبر است');
        }
        const uploadsDir = (0, node_path_1.join)(process.cwd(), 'uploads', 'products');
        await node_fs_1.promises.mkdir(uploadsDir, { recursive: true });
        const fileName = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${validation.safeExtension}`;
        const fullPath = (0, node_path_1.join)(uploadsDir, fileName);
        await node_fs_1.promises.writeFile(fullPath, file.buffer);
        return {
            url: `/uploads/products/${fileName}`,
            fileName,
        };
    }
    async createProduct(auth, dto) {
        verifyAdmin(auth);
        const existingSlug = await this.prisma.shopProduct.findUnique({ where: { slug: dto.slug } });
        if (existingSlug)
            throw new common_1.BadRequestException('این slug قبلاً ثبت شده است');
        const existingSku = await this.prisma.shopProduct.findUnique({ where: { sku: dto.sku ?? '' } });
        if (existingSku)
            throw new common_1.BadRequestException('این SKU قبلاً ثبت شده است');
        return this.prisma.shopProduct.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description ?? '',
                shortDescription: dto.shortDescription ?? '',
                technicalSpecifications: dto.technicalSpecifications ?? '',
                categoryId: dto.categoryId,
                brand: dto.brand ?? '',
                sku: dto.sku ?? '',
                price: dto.price,
                oldPrice: dto.oldPrice,
                discountPercent: dto.discountPercent ?? 0,
                stock: dto.stock ?? 0,
                maxOrderQty: (0, shop_rules_1.normalizeMaxOrderQty)(dto.maxOrderQty),
                imageUrl: dto.imageUrl ?? '',
                isActive: dto.isActive ?? true,
                isFeatured: dto.isFeatured ?? false,
            },
            include: { category: true },
        });
    }
    async updateProduct(auth, id, dto) {
        verifyAdmin(auth);
        const product = await this.prisma.shopProduct.findUnique({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('محصول یافت نشد');
        if (dto.slug && dto.slug !== product.slug) {
            const existing = await this.prisma.shopProduct.findUnique({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException('این slug قبلاً ثبت شده است');
        }
        const updateData = { ...dto };
        if (dto.maxOrderQty !== undefined) {
            updateData.maxOrderQty = (0, shop_rules_1.normalizeMaxOrderQty)(dto.maxOrderQty);
        }
        return this.prisma.shopProduct.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });
    }
    async deleteProduct(auth, id) {
        verifyAdmin(auth);
        const product = await this.prisma.shopProduct.findUnique({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('محصول یافت نشد');
        const orderItemCount = await this.prisma.shopOrderItem.count({ where: { productId: id } });
        if (orderItemCount > 0)
            throw new common_1.BadRequestException('این محصول در سفارش‌ها استفاده شده و قابل حذف نیست');
        await this.prisma.shopProduct.delete({ where: { id } });
        return { ok: true };
    }
    // ── Discounts ──
    async listDiscounts(auth) {
        verifyAdmin(auth);
        return this.prisma.shopDiscount.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async createDiscount(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.shopDiscount.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.BadRequestException('این کد تخفیف قبلاً ثبت شده است');
        return this.prisma.shopDiscount.create({
            data: {
                code: dto.code,
                description: dto.description ?? '',
                type: dto.type,
                value: dto.value,
                minOrderAmount: dto.minOrderAmount,
                maxDiscountAmount: dto.maxDiscountAmount,
                usageLimit: dto.usageLimit,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateDiscount(auth, id, dto) {
        verifyAdmin(auth);
        const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
        if (!discount)
            throw new common_1.NotFoundException('کد تخفیف یافت نشد');
        const data = {};
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.value !== undefined)
            data.value = dto.value;
        if (dto.minOrderAmount !== undefined)
            data.minOrderAmount = dto.minOrderAmount;
        if (dto.maxDiscountAmount !== undefined)
            data.maxDiscountAmount = dto.maxDiscountAmount;
        if (dto.usageLimit !== undefined)
            data.usageLimit = dto.usageLimit;
        if (dto.startsAt !== undefined)
            data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
        if (dto.endsAt !== undefined)
            data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        return this.prisma.shopDiscount.update({ where: { id }, data });
    }
    async deleteDiscount(auth, id) {
        verifyAdmin(auth);
        const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
        if (!discount)
            throw new common_1.NotFoundException('کد تخفیف یافت نشد');
        await this.prisma.shopDiscount.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AdminShopController = AdminShopController;
__decorate([
    (0, common_1.Get)('categories'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ProductQueryDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseInterceptors)(new multipart_upload_1.MultipartUploadInterceptor({
        fieldName: 'file',
        maxFiles: 1,
        maxFileSize: shop_rules_1.MAX_PRODUCT_IMAGE_SIZE_BYTES,
    })),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, multipart_upload_1.UploadedMultipartFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "uploadProductImage", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateProductDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateProductDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('discounts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "listDiscounts", null);
__decorate([
    (0, common_1.Post)('discounts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateDiscountDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "createDiscount", null);
__decorate([
    (0, common_1.Patch)('discounts/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateDiscountDto]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "updateDiscount", null);
__decorate([
    (0, common_1.Delete)('discounts/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminShopController.prototype, "deleteDiscount", null);
exports.AdminShopController = AdminShopController = __decorate([
    (0, common_1.Controller)('admin/shop'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminShopController);
