import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@prisma/client';
import {
  MultipartUploadInterceptor,
  UploadedMultipartFile,
  type StoredUploadFile,
} from './multipart-upload';
import { PrismaService } from './prisma.service';
import { verifyAdminToken } from './auth-token';
import {
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  normalizeMaxOrderQty,
  validateProductImageFile,
} from './shop-rules';

function verifyAdmin(auth?: string) {
  return verifyAdminToken(auth);
}

// ── Category DTOs ──

class CreateCategoryDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsString() aboutTitle?: string;
  @IsOptional() @IsString() aboutDescription?: string;
  @IsOptional() @IsString() aboutImageUrl?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() colorTheme?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() displayOrder?: number;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsString() aboutTitle?: string;
  @IsOptional() @IsString() aboutDescription?: string;
  @IsOptional() @IsString() aboutImageUrl?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() colorTheme?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() displayOrder?: number;
}

// ── Product DTOs ──

class CreateProductDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() technicalSpecifications?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() sku?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsNumber() oldPrice?: number;
  @IsOptional() @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(1) maxOrderQty?: number | null;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() technicalSpecifications?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() oldPrice?: number;
  @IsOptional() @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(1) maxOrderQty?: number | null;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

class ProductQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

// ── Discount DTOs ──

class CreateDiscountDto {
  @IsString() @MinLength(2) code!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() type!: string;
  @IsNumber() @Min(0) value!: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
  @IsOptional() @IsNumber() maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateDiscountDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
  @IsOptional() @IsNumber() maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('admin/shop')
export class AdminShopController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ──

  @Get('categories')
  async listCategories(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.shopCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  @Post('categories')
  async createCategory(@Headers('authorization') auth: string, @Body() dto: CreateCategoryDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.shopCategory.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('این slug قبلاً ثبت شده است');

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

  @Patch('categories/:id')
  async updateCategory(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    verifyAdmin(auth);

    const category = await this.prisma.shopCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.shopCategory.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('این slug قبلاً ثبت شده است');
    }

    return this.prisma.shopCategory.update({
      where: { id },
      data: dto,
      include: { children: true, parent: true },
    });
  }

  @Delete('categories/:id')
  async deleteCategory(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const category = await this.prisma.shopCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');

    const productCount = await this.prisma.shopProduct.count({ where: { categoryId: id } });
    if (productCount > 0) throw new BadRequestException('این دسته‌بندی دارای محصول است و قابل حذف نیست');

    await this.prisma.shopCategory.delete({ where: { id } });
    return { ok: true };
  }

  // ── Products ──

  @Get('products')
  async listProducts(@Headers('authorization') auth: string, @Query() query: ProductQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.ShopProductWhereInput = {};
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'inactive') where.isActive = false;
    if (query.categorySlug) {
      const cat = await this.prisma.shopCategory.findUnique({ where: { slug: query.categorySlug } });
      if (cat) where.categoryId = cat.id;
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

    const order: Prisma.ShopProductOrderByWithRelationInput = {};
    if (query.sort === 'price-asc') order.price = 'asc';
    else if (query.sort === 'price-desc') order.price = 'desc';
    else if (query.sort === 'stock-asc') order.stock = 'asc';
    else if (query.sort === 'stock-desc') order.stock = 'desc';
    else if (query.sort === 'sales') order.salesCount = 'desc';
    else order.createdAt = 'desc';

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

  @Get('products/:id')
  async getProduct(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const product = await this.prisma.shopProduct.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return product;
  }

  @Post('upload-image')
  @UseInterceptors(
    new MultipartUploadInterceptor({
      fieldName: 'file',
      maxFiles: 1,
      maxFileSize: MAX_PRODUCT_IMAGE_SIZE_BYTES,
    }),
  )
  async uploadProductImage(
    @Headers('authorization') auth: string,
    @UploadedMultipartFile() file?: StoredUploadFile,
  ) {
    verifyAdmin(auth);

    const validation = validateProductImageFile(file);
    if (!validation.valid || !file?.buffer) {
      throw new BadRequestException(validation.message ?? 'فایل تصویر نامعتبر است');
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'products');
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${validation.safeExtension}`;
    const fullPath = join(uploadsDir, fileName);
    await fs.writeFile(fullPath, file.buffer);

    return {
      url: `/uploads/products/${fileName}`,
      fileName,
    };
  }

  @Post('products')
  async createProduct(@Headers('authorization') auth: string, @Body() dto: CreateProductDto) {
    verifyAdmin(auth);

    const existingSlug = await this.prisma.shopProduct.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new BadRequestException('این slug قبلاً ثبت شده است');

    const existingSku = await this.prisma.shopProduct.findUnique({ where: { sku: dto.sku ?? '' } });
    if (existingSku) throw new BadRequestException('این SKU قبلاً ثبت شده است');

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
        maxOrderQty: normalizeMaxOrderQty(dto.maxOrderQty),
        imageUrl: dto.imageUrl ?? '',
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
      },
      include: { category: true },
    });
  }

  @Put('products/:id')
  async updateProduct(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    verifyAdmin(auth);

    const product = await this.prisma.shopProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.shopProduct.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('این slug قبلاً ثبت شده است');
    }

    const updateData: Prisma.ShopProductUncheckedUpdateInput = { ...dto };
    if (dto.maxOrderQty !== undefined) {
      updateData.maxOrderQty = normalizeMaxOrderQty(dto.maxOrderQty);
    }

    return this.prisma.shopProduct.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  @Delete('products/:id')
  async deleteProduct(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const product = await this.prisma.shopProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const orderItemCount = await this.prisma.shopOrderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) throw new BadRequestException('این محصول در سفارش‌ها استفاده شده و قابل حذف نیست');

    await this.prisma.shopProduct.delete({ where: { id } });
    return { ok: true };
  }

  // ── Discounts ──

  @Get('discounts')
  async listDiscounts(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.shopDiscount.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('discounts')
  async createDiscount(@Headers('authorization') auth: string, @Body() dto: CreateDiscountDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.shopDiscount.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('این کد تخفیف قبلاً ثبت شده است');

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

  @Patch('discounts/:id')
  async updateDiscount(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    verifyAdmin(auth);

    const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');

    const data: Prisma.ShopDiscountUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minOrderAmount !== undefined) data.minOrderAmount = dto.minOrderAmount;
    if (dto.maxDiscountAmount !== undefined) data.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.shopDiscount.update({ where: { id }, data });
  }

  @Delete('discounts/:id')
  async deleteDiscount(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');

    await this.prisma.shopDiscount.delete({ where: { id } });
    return { ok: true };
  }
}
