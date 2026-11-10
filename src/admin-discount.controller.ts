import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function verifyAdmin(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new UnauthorizedException('دسترسی مجاز نیست');
    return payload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class CreateDiscountCodeDto {
  @IsString() @MinLength(2) code!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['percent', 'fixed']) type!: string;
  @IsNumber() @Min(0) value!: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
  @IsOptional() @IsNumber() maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() targetUserId?: string;
}

class UpdateDiscountCodeDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['percent', 'fixed']) type?: string;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() minOrderAmount?: number;
  @IsOptional() @IsNumber() maxDiscountAmount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() targetUserId?: string;
}

class DiscountQueryDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('admin/discounts')
export class AdminDiscountController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listDiscounts(@Headers('authorization') auth: string, @Query() query: DiscountQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.ShopDiscountWhereInput = {};
    if (query.type && query.type !== 'all') where.type = query.type;
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'inactive') where.isActive = false;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { code: { contains: value, mode: 'insensitive' } },
        { description: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, rawItems] = await Promise.all([
      this.prisma.shopDiscount.count({ where }),
      this.prisma.shopDiscount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items = rawItems.map((d) => {
      const match = d.description.match(/\[targetUser:([^\]]+)\]/);
      const targetUserId = match ? match[1] : null;
      const cleanDesc = d.description.replace(/\[targetUser:[^\]]+\]/, '').trim();
      return {
        ...d,
        description: cleanDesc,
        targetUserId,
        isUserSpecific: Boolean(targetUserId),
      };
    });

    return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
  }

  @Get(':id')
  async getDiscount(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');

    const match = discount.description.match(/\[targetUser:([^\]]+)\]/);
    const targetUserId = match ? match[1] : null;
    const cleanDesc = discount.description.replace(/\[targetUser:[^\]]+\]/, '').trim();

    return {
      ...discount,
      description: cleanDesc,
      targetUserId,
      isUserSpecific: Boolean(targetUserId),
    };
  }

  @Post()
  async createDiscount(@Headers('authorization') auth: string, @Body() dto: CreateDiscountCodeDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.shopDiscount.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('این کد تخفیف قبلاً ثبت شده است');

    if (dto.targetUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
      if (!user) throw new BadRequestException('کاربر هدف یافت نشد');
    }

    const rawDesc = (dto.description ?? '').trim();
    const finalDesc = dto.targetUserId ? `${rawDesc} [targetUser:${dto.targetUserId}]`.trim() : rawDesc;

    return this.prisma.shopDiscount.create({
      data: {
        code: dto.code,
        description: finalDesc,
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

  @Patch(':id')
  async updateDiscount(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountCodeDto,
  ) {
    verifyAdmin(auth);

    const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');

    const data: Prisma.ShopDiscountUpdateInput = {};
    if (dto.description !== undefined || dto.targetUserId !== undefined) {
      const baseDesc = dto.description !== undefined
        ? dto.description.trim()
        : discount.description.replace(/\[targetUser:[^\]]+\]/, '').trim();
      const currentTargetUser = dto.targetUserId !== undefined
        ? dto.targetUserId
        : (discount.description.match(/\[targetUser:([^\]]+)\]/)?.[1] ?? null);

      data.description = currentTargetUser ? `${baseDesc} [targetUser:${currentTargetUser}]`.trim() : baseDesc;
    }
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

  @Delete(':id')
  async deleteDiscount(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const discount = await this.prisma.shopDiscount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');

    await this.prisma.shopDiscount.delete({ where: { id } });
    return { ok: true };
  }
}
