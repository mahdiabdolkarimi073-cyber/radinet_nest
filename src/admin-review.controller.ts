import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { verifyAdminToken } from './auth-token';

class AdminReviewQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() targetType?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class UpdateReviewStatusDto {
  @IsString() status!: 'approved' | 'rejected' | 'pending';
  @IsOptional() @IsString() rejectReason?: string;
}

@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly prisma: PrismaService) {}

  private async recalculateProductReviewStats(productId: string) {
    const product = await this.prisma.shopProduct.findUnique({ where: { id: productId } });
    if (!product) return;

    const approvedReviews = await this.prisma.review.findMany({
      where: {
        targetType: 'product',
        targetId: productId,
        status: 'approved',
      },
      select: { rating: true },
    });

    const reviewCount = approvedReviews.length;
    const avgRating =
      reviewCount > 0
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

  @Get()
  async listReviews(@Headers('authorization') authHeader: string | undefined, @Query() query: AdminReviewQueryDto) {
    verifyAdminToken(authHeader);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.ReviewWhereInput = {};
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

    const productIds = Array.from(
      new Set(items.filter((r) => r.targetType === 'product' && r.targetId).map((r) => r.targetId as string)),
    );
    const products =
      productIds.length > 0
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
          status: r.status as 'pending' | 'approved' | 'rejected',
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

  @Patch(':id')
  async updateStatus(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    const admin = verifyAdminToken(authHeader);

    if (!['approved', 'rejected', 'pending'].includes(dto.status)) {
      throw new BadRequestException('وضعیت نامعتبر است');
    }

    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('نظر یافت نشد');

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

  @Delete(':id')
  async deleteReview(@Headers('authorization') authHeader: string | undefined, @Param('id') id: string) {
    verifyAdminToken(authHeader);

    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('نظر یافت نشد');

    await this.prisma.review.delete({ where: { id } });

    if (existing.targetType === 'product' && existing.targetId) {
      await this.recalculateProductReviewStats(existing.targetId);
    }

    return { ok: true };
  }
}
