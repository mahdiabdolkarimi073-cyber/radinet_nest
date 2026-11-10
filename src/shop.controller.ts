import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { verifyAuthToken } from './auth-token';
import {
  normalizeMaxOrderQty,
  validateProductOrderQuantities,
  validateReviewSubmission,
} from './shop-rules';

class CreateShippingMethodDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsString() estimatedDays?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class CreateCategoryDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsString() aboutTitle?: string;
  @IsOptional() @IsString() aboutDescription?: string;
  @IsOptional() @IsString() aboutImageUrl?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() colorTheme?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
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
  @IsOptional() @IsNumber() displayOrder?: number;
}

class CreateProductDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() technicalSpecifications?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() sku?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsNumber() oldPrice?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsNumber() stock?: number;
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
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsNumber() stock?: number;
  @IsOptional() @IsInt() @Min(1) maxOrderQty?: number | null;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

class CreateOrderItemDto {
  @IsString() productId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

class ValidateCartDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

class CreateProductReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() content!: string;
}

class CreateOrderDto {
  @IsString() customerName!: string;
  @IsString() customerPhone!: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() shippingAddress?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
  @IsOptional() @IsString() discountCode?: string;
  // Checkout fields
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() shippingMethod?: string;
  @IsOptional() @IsBoolean() needInvoice?: boolean;
  @IsOptional() @IsString() companyNationalId?: string;
  @IsOptional() @IsString() companyEconomicCode?: string;
  @IsOptional() @IsString() companyRegistrationNumber?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() paymentMethod?: string;
}

@Controller('shop')
export class ShopController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ──
  @Get('categories')
  async categories(@Query('includeInactive') includeInactive?: string) {
    return this.prisma.shopCategory.findMany({
      where: includeInactive === 'true' ? undefined : { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
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
        displayOrder: dto.displayOrder ?? 0,
      },
      include: { children: true, parent: true },
    });
  }

  @Patch('categories/:slug')
  async updateCategory(@Param('slug') slug: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.prisma.shopCategory.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return this.prisma.shopCategory.update({
      where: { id: category.id },
      data: dto,
      include: { children: true, parent: true },
    });
  }

  @Get('categories/:slug')
  async categoryBySlug(@Param('slug') slug: string) {
    const category = await this.prisma.shopCategory.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
  }

  // ── Cart configuration ──
  @Get('cart/config')
  async cartConfig() {
    const setting = await this.prisma.siteSetting.findUnique({ where: { settingKey: 'shop_checkout' } });
    const value = setting?.settingValue;
    const config = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return {
      taxRate: typeof config.taxRate === 'number' ? config.taxRate : 0,
      shippingCost: typeof config.shippingCost === 'number' ? config.shippingCost : 0,
      freeShippingThreshold: typeof config.freeShippingThreshold === 'number' ? config.freeShippingThreshold : 0,
    };
  }

  @Post('cart/validate')
  async validateCart(@Body() dto: ValidateCartDto) {
    const rawItems = Array.isArray(dto?.items) ? dto.items : [];
    const productIds = Array.from(new Set(rawItems.map((i) => i.productId)));
    const products = await this.prisma.shopProduct.findMany({
      where: { id: { in: productIds } },
    });
    const check = validateProductOrderQuantities(
      rawItems,
      products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        maxOrderQty: p.maxOrderQty,
        isActive: p.isActive,
      })),
    );
    if (!check.valid) {
      throw new BadRequestException(check.message ?? 'محدودیت تعداد خرید رعایت نشده است');
    }
    return { valid: true };
  }

  // ── Products ──
  @Get('products')
  async products(
    @Query('categorySlug') categorySlug?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('sort') sort?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('includeInactive') includeInactive?: string,
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('inStock') inStock?: string,
    @Query('brand') brand?: string,
    @Query('brands') brands?: string,
    @Query('hasDiscount') hasDiscount?: string,
    @Query('outOfStock') outOfStock?: string,
  ) {
    const where: any = {};
    if (includeInactive !== 'true') where.isActive = true;
    if (featured === 'true') where.isFeatured = true;
    if (inStock === 'true') where.stock = { gt: 0 };
    if (outOfStock === 'true') where.stock = { equals: 0 };
    if (hasDiscount === 'true') where.discountPercent = { gt: 0 };
    if (brand) where.brand = brand;
    if (brands) {
      const brandList = brands.split(',').map((b) => b.trim()).filter(Boolean);
      if (brandList.length === 1) where.brand = brandList[0];
      else if (brandList.length > 1) where.brand = { in: brandList };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    if (categorySlug) {
      const cat = await this.prisma.shopCategory.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { technicalSpecifications: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    const order: any = {};
    if (sort === 'price-asc') order.price = 'asc';
    else if (sort === 'price-desc') order.price = 'desc';
    else if (sort === 'sales') order.salesCount = 'desc';
    else if (sort === 'rating') order.rating = 'desc';
    else if (sort === 'newest') order.createdAt = 'desc';
    else order.createdAt = 'desc';

    const take = Math.min(pageSize ?? 20, 100);
    const skip = ((page ?? 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.shopProduct.findMany({ where, orderBy: order, take, skip, include: { category: true } }),
      this.prisma.shopProduct.count({ where }),
    ]);
    return { items, total, page: page ?? 1, pageSize: take };
  }

  @Get('products/brands')
  async productBrands() {
    const rows = await this.prisma.shopProduct.findMany({
      where: { isActive: true, brand: { not: '' } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });
    return rows.map((r) => r.brand);
  }

  @Get('products/featured')
  async featuredProducts() {
    return this.prisma.shopProduct.findMany({
      where: { isFeatured: true, isActive: true, stock: { gt: 0 } },
      orderBy: { salesCount: 'desc' },
      take: 8,
      include: { category: true },
    });
  }

  @Get('products/:slug')
  async productBySlug(@Param('slug') slug: string) {
    const product = await this.prisma.shopProduct.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    let related: any[] = [];
    if (product.categoryId) {
      related = await this.prisma.shopProduct.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          id: { not: product.id },
        },
        orderBy: { salesCount: 'desc' },
        take: 5,
        include: { category: true },
      });
    }
    if (related.length === 0) {
      related = await this.prisma.shopProduct.findMany({
        where: { isActive: true, id: { not: product.id } },
        orderBy: { salesCount: 'desc' },
        take: 5,
        include: { category: true },
      });
    }

    return { ...product, related };
  }

  // ── Product Reviews (Public approved list + Authenticated user submission) ──
  @Get('products/:slug/reviews')
  async getProductReviews(@Param('slug') slug: string) {
    const product = await this.prisma.shopProduct.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const reviews = await this.prisma.review.findMany({
      where: {
        targetType: 'product',
        targetId: product.id,
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
    });

    return {
      items: reviews.map((r) => ({
        id: r.id,
        productId: product.id,
        productName: product.name,
        userId: r.userId,
        userName: r.user?.fullName || 'کاربر رادینت',
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
      total: reviews.length,
    };
  }

  @Post('products/:slug/reviews')
  async submitProductReview(
    @Headers('authorization') authHeader: string | undefined,
    @Param('slug') slug: string,
    @Body() dto: CreateProductReviewDto,
  ) {
    const authUser = verifyAuthToken(authHeader);
    const product = await this.prisma.shopProduct.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const existingUserReviews = await this.prisma.review.findMany({
      where: {
        userId: authUser.userId,
        targetType: 'product',
        targetId: product.id,
      },
      select: {
        content: true,
        status: true,
      },
    });

    const check = validateReviewSubmission({
      rating: dto?.rating,
      content: dto?.content,
      existingUserProductReviews: existingUserReviews,
    });
    if (!check.valid || !check.sanitizedContent || !check.rating) {
      throw new BadRequestException(check.message ?? 'اطلاعات نظر نامعتبر است');
    }

    const review = await this.prisma.review.create({
      data: {
        userId: authUser.userId,
        targetType: 'product',
        targetId: product.id,
        rating: check.rating,
        content: check.sanitizedContent,
        status: 'pending',
      },
    });

    return {
      id: review.id,
      status: review.status,
      message: 'نظر شما با موفقیت ثبت شد و پس از بررسی و تأیید مدیریت در صفحه محصول نمایش داده خواهد شد.',
    };
  }

  // ── Support Reviews (Public approved list + Authenticated user submission) ──
  @Get('support-reviews')
  async getSupportReviews() {
    const reviews = await this.prisma.review.findMany({
      where: {
        targetType: 'support',
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
    });

    return {
      items: reviews.map((r) => ({
        id: r.id,
        productId: 'support-center',
        productName: 'بخش پشتیبانی رادینت',
        targetType: 'support',
        targetId: r.targetId || 'support-center',
        targetName: 'بخش پشتیبانی رادینت',
        userId: r.userId,
        userName: r.user?.fullName || 'کاربر رادینت',
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
      total: reviews.length,
    };
  }

  @Post('support-reviews')
  async submitSupportReview(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateProductReviewDto,
  ) {
    const authUser = verifyAuthToken(authHeader);

    const existingUserReviews = await this.prisma.review.findMany({
      where: {
        userId: authUser.userId,
        targetType: 'support',
      },
      select: {
        content: true,
        status: true,
      },
    });

    const check = validateReviewSubmission({
      rating: dto?.rating,
      content: dto?.content,
      existingUserProductReviews: existingUserReviews,
    });
    if (!check.valid || !check.sanitizedContent || !check.rating) {
      throw new BadRequestException(check.message ?? 'اطلاعات نظر نامعتبر است');
    }

    const review = await this.prisma.review.create({
      data: {
        userId: authUser.userId,
        targetType: 'support',
        targetId: 'support-center',
        rating: check.rating,
        content: check.sanitizedContent,
        status: 'pending',
      },
    });

    return {
      id: review.id,
      status: review.status,
      message: 'نظر شما با موفقیت ثبت شد و پس از بررسی و تأیید ادمین در بخش پشتیبانی نمایش داده خواهد شد.',
    };
  }

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
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
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.prisma.shopProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    const updateData: any = { ...dto };
    if (dto.maxOrderQty !== undefined) {
      updateData.maxOrderQty = normalizeMaxOrderQty(dto.maxOrderQty);
    }
    return this.prisma.shopProduct.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  // ── Shipping methods ──
  @Get('shipping-methods')
  async shippingMethods() {
    return this.prisma.shopShippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('shipping-methods')
  async createShippingMethod(@Body() dto: CreateShippingMethodDto) {
    return this.prisma.shopShippingMethod.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price,
        estimatedDays: dto.estimatedDays,
        iconKey: dto.iconKey ?? 'truck',
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  // ── Orders ──
  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }
    const uniqueProductIds = Array.from(new Set(dto.items.map((i) => i.productId)));
    const products = await this.prisma.shopProduct.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    const validation = validateProductOrderQuantities(
      dto.items,
      products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        maxOrderQty: p.maxOrderQty,
        isActive: p.isActive,
      })),
    );
    if (!validation.valid) {
      throw new BadRequestException(validation.message ?? 'محدودیت تعداد خرید رعایت نشده است');
    }
    const normalizedItems = validation.aggregatedItems.map((entry) => ({
      productId: entry.productId,
      quantity: entry.quantity,
    }));

    // Enforce cumulative maxOrderQty per customer across previous non-cancelled orders
    const cappedProducts = products.filter((p) => typeof p.maxOrderQty === 'number' && p.maxOrderQty > 0);
    if (cappedProducts.length > 0 && dto.customerPhone?.trim()) {
      const previousOrders = await this.prisma.shopOrder.findMany({
        where: {
          customerPhone: dto.customerPhone.trim(),
          status: { not: 'cancelled' },
        },
        include: { items: true },
      });

      for (const item of normalizedItems) {
        const prod = cappedProducts.find((p) => p.id === item.productId);
        if (!prod || !prod.maxOrderQty) continue;
        const prevQty = previousOrders.reduce((sum, ord) => {
          const ordProductQty = ord.items
            .filter((oi) => oi.productId === prod.id)
            .reduce((s, oi) => s + oi.quantity, 0);
          return sum + ordProductQty;
        }, 0);
        if (prevQty + item.quantity > prod.maxOrderQty) {
          const remaining = Math.max(0, prod.maxOrderQty - prevQty);
          throw new BadRequestException(
            remaining > 0
              ? `سقف خرید کالای «${prod.name}» برای هر مشتری ${prod.maxOrderQty} عدد است. شما قبلاً ${prevQty} عدد سفارش داده‌اید و حداکثر ${remaining} عدد دیگر می‌توانید سفارش دهید.`
              : `سقف مجاز خرید کالای «${prod.name}» (${prod.maxOrderQty} عدد برای هر مشتری) توسط شما تکمیل شده است.`,
          );
        }
      }
    }

    let discountTotal = 0;
    let appliedDiscount: any = null;
    if (dto.discountCode) {
      const discount = await this.prisma.shopDiscount.findUnique({ where: { code: dto.discountCode } });
      if (!discount || !discount.isActive) throw new BadRequestException('کد تخفیف نامعتبر است');
      const now = new Date();
      if (discount.startsAt && now < discount.startsAt) throw new BadRequestException('کد تخفیف هنوز فعال نشده');
      if (discount.endsAt && now > discount.endsAt) throw new BadRequestException('کد تخفیف منقضی شده');
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) throw new BadRequestException('سقف استفاده از کد تخفیف پر شده');
      appliedDiscount = discount;
    }
    const items: any[] = normalizedItems.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
      const unit = Number(p.price);
      const line = unit * item.quantity;
      if (appliedDiscount && appliedDiscount.type === 'percent') {
        discountTotal += Math.round((line * Number(appliedDiscount.value)) / 100);
      }
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        quantity: item.quantity,
        lineTotal: BigInt(line),
      };
    });
    const subtotal = items.reduce((s, i) => s + Number(i.lineTotal), 0);
    let shippingCost = 0;
    let shippingMethodName: string | null = null;
    if (dto.shippingMethod) {
      const sm = await this.prisma.shopShippingMethod.findUnique({ where: { code: dto.shippingMethod } });
      if (sm && sm.isActive) {
        shippingCost = Number(sm.price);
        shippingMethodName = sm.name;
      }
    }
    const total = subtotal - discountTotal + shippingCost;
    const orderNumber = `RAD-${Date.now().toString(36).toUpperCase()}`;
    const order = await this.prisma.shopOrder.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        shippingAddress: dto.shippingAddress ?? '',
        notes: dto.notes,
        subtotal,
        discountTotal,
        shippingCost,
        total,
        status: 'pending',
        paymentStatus: 'unpaid',
        firstName: dto.firstName,
        lastName: dto.lastName,
        province: dto.province,
        city: dto.city,
        postalCode: dto.postalCode,
        shippingMethod: dto.shippingMethod,
        shippingMethodName,
        needInvoice: dto.needInvoice ?? false,
        companyNationalId: dto.companyNationalId,
        companyEconomicCode: dto.companyEconomicCode,
        companyRegistrationNumber: dto.companyRegistrationNumber,
        companyName: dto.companyName,
        paymentMethod: dto.paymentMethod,
        items: { create: items.map((i) => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal })) },
      },
      include: { items: true },
    });
    await Promise.all(
      normalizedItems.map((item) =>
        this.prisma.shopProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        }),
      ),
    );
    if (appliedDiscount) {
      await this.prisma.shopDiscount.update({
        where: { id: appliedDiscount.id },
        data: { usedCount: { increment: 1 } },
      });
    }
    return order;
  }

  @Get('orders/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { select: { imageUrl: true, slug: true } } } } },
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  @Get('orders/phone/:phone')
  async ordersByPhone(@Param('phone') phone: string) {
    return this.prisma.shopOrder.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { imageUrl: true, slug: true } } } } },
    });
  }

  // ── Discounts ──
  @Get('discounts/:code')
  async validateDiscount(@Param('code') code: string) {
    const discount = await this.prisma.shopDiscount.findUnique({ where: { code } });
    if (!discount || !discount.isActive) throw new NotFoundException('کد تخفیف نامعتبر است');
    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) throw new BadRequestException('کد تخفیف هنوز فعال نشده');
    if (discount.endsAt && now > discount.endsAt) throw new BadRequestException('کد تخفیف منقضی شده');
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) throw new BadRequestException('سقف استفاده پر شده');
    return discount;
  }

  // ── Order status (admin) ──
  @Patch('orders/:orderNumber/status')
  async updateOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { status?: string; trackingCode?: string; paymentStatus?: string },
  ) {
    const order = await this.prisma.shopOrder.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return this.prisma.shopOrder.update({
      where: { orderNumber },
      data: {
        status: body.status,
        trackingCode: body.trackingCode,
        paymentStatus: body.paymentStatus,
      },
      include: { items: true },
    });
  }

  @Get('orders')
  async allOrders() {
    return this.prisma.shopOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 100,
    });
  }
}
