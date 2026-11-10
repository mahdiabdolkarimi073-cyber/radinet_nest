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
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
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

// ── Country Tariff Setting DTOs ──

class CreateCountryTariffDto {
  @IsString() @MinLength(2) countryCode!: string;
  @IsString() @MinLength(2) countryName!: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsNumber() commissionPercent?: number;
  @IsOptional() @IsNumber() taxPercent?: number;
  @IsOptional() @IsBoolean() aiAnalysisEnabled?: boolean;
  @IsOptional() @IsNumber() aiAnalysisPrice?: number;
  @IsOptional() @IsBoolean() rushEnabled?: boolean;
  @IsOptional() @IsNumber() rushPriceMultiplier?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateCountryTariffDto {
  @IsOptional() @IsString() countryName?: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsNumber() commissionPercent?: number;
  @IsOptional() @IsNumber() taxPercent?: number;
  @IsOptional() @IsBoolean() aiAnalysisEnabled?: boolean;
  @IsOptional() @IsNumber() aiAnalysisPrice?: number;
  @IsOptional() @IsBoolean() rushEnabled?: boolean;
  @IsOptional() @IsNumber() rushPriceMultiplier?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Area Tariff DTOs ──

class CreateAreaTariffDto {
  @IsString() countryCode!: string;
  @IsString() imagingType!: string;
  @IsString() imagingArea!: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateAreaTariffDto {
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class AreaTariffQueryDto {
  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() imagingType?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('admin/ai-tariff')
export class AdminAiTariffController {
  constructor(private readonly prisma: PrismaService) {}

  // ── AI Analysis Global Toggle ──

  @Get('ai-status')
  async getAiStatus(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    const setting = await this.prisma.siteSetting.findUnique({
      where: { settingKey: 'ai_analysis_global' },
    });
    const value =
      setting?.settingValue && typeof setting.settingValue === 'object' && !Array.isArray(setting.settingValue)
        ? (setting.settingValue as Record<string, unknown>)
        : {};
    const aiAnalysisEnabled =
      typeof value.aiAnalysisEnabled === 'boolean'
        ? value.aiAnalysisEnabled
        : typeof value.enabled === 'boolean'
          ? value.enabled
          : true;
    const aiPricingEnabled =
      typeof value.aiPricingEnabled === 'boolean' ? value.aiPricingEnabled : true;
    const suggestedPrice =
      typeof value.suggestedPrice === 'number' && Number.isFinite(value.suggestedPrice) && value.suggestedPrice >= 0
        ? Math.round(value.suggestedPrice)
        : 950000;
    return {
      enabled: aiAnalysisEnabled,
      aiAnalysisEnabled,
      aiPricingEnabled,
      suggestedPrice,
      currency: typeof value.currency === 'string' ? value.currency : 'IRR',
    };
  }

  @Patch('ai-status')
  async toggleAiStatus(
    @Headers('authorization') auth: string,
    @Body()
    body: {
      enabled?: boolean;
      aiAnalysisEnabled?: boolean;
      aiPricingEnabled?: boolean;
      suggestedPrice?: number;
      currency?: string;
    },
  ) {
    verifyAdmin(auth);
    const current = await this.getAiStatus(auth);
    const nextAnalysisEnabled =
      typeof body.aiAnalysisEnabled === 'boolean'
        ? body.aiAnalysisEnabled
        : typeof body.enabled === 'boolean'
          ? body.enabled
          : current.aiAnalysisEnabled;
    const nextPricingEnabled =
      typeof body.aiPricingEnabled === 'boolean' ? body.aiPricingEnabled : current.aiPricingEnabled;
    let nextSuggestedPrice = current.suggestedPrice;
    if (body.suggestedPrice !== undefined) {
      const parsed = Number(body.suggestedPrice);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new BadRequestException('مبلغ پیشنهادی هوش مصنوعی نامعتبر است');
      }
      nextSuggestedPrice = Math.round(parsed);
    }

    const payload = {
      enabled: nextAnalysisEnabled,
      aiAnalysisEnabled: nextAnalysisEnabled,
      aiPricingEnabled: nextPricingEnabled,
      suggestedPrice: nextSuggestedPrice,
      currency: body.currency ?? current.currency ?? 'IRR',
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.siteSetting.upsert({
      where: { settingKey: 'ai_analysis_global' },
      create: {
        settingKey: 'ai_analysis_global',
        settingValue: payload,
      },
      update: {
        settingValue: payload,
      },
    });
    return payload;
  }

  // ── Country Tariff Settings ──

  @Get('countries')
  async listCountryTariffs(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.countryTariffSetting.findMany({
      orderBy: [{ isActive: 'desc' }, { countryName: 'asc' }],
    });
  }

  @Get('countries/:id')
  async getCountryTariff(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('تنظیمات کشور یافت نشد');
    return setting;
  }

  @Post('countries')
  async createCountryTariff(@Headers('authorization') auth: string, @Body() dto: CreateCountryTariffDto) {
    verifyAdmin(auth);
    const existing = await this.prisma.countryTariffSetting.findUnique({
      where: { countryCode: dto.countryCode },
    });
    if (existing) throw new BadRequestException('این کشور قبلاً ثبت شده است');

    return this.prisma.countryTariffSetting.create({
      data: {
        countryCode: dto.countryCode,
        countryName: dto.countryName,
        currencyCode: dto.currencyCode ?? 'IRR',
        commissionPercent: dto.commissionPercent ?? 0,
        taxPercent: dto.taxPercent ?? 0,
        aiAnalysisEnabled: dto.aiAnalysisEnabled ?? false,
        aiAnalysisPrice: dto.aiAnalysisPrice ?? 0,
        rushEnabled: dto.rushEnabled ?? false,
        rushPriceMultiplier: dto.rushPriceMultiplier ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch('countries/:id')
  async updateCountryTariff(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateCountryTariffDto,
  ) {
    verifyAdmin(auth);
    const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('تنظیمات کشور یافت نشد');

    return this.prisma.countryTariffSetting.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('countries/:id')
  async deleteCountryTariff(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const setting = await this.prisma.countryTariffSetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('تنظیمات کشور یافت نشد');

    await this.prisma.countryTariffSetting.delete({ where: { id } });
    return { ok: true };
  }

  // ── Area Tariffs ──

  @Get('areas')
  async listAreaTariffs(@Headers('authorization') auth: string, @Query() query: AreaTariffQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.AreaTariffWhereInput = {};
    if (query.countryCode && query.countryCode !== 'all') where.countryCode = query.countryCode;
    if (query.imagingType && query.imagingType !== 'all') where.imagingType = query.imagingType;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { imagingType: { contains: value, mode: 'insensitive' } },
        { imagingArea: { contains: value, mode: 'insensitive' } },
        { countryCode: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.areaTariff.count({ where }),
      this.prisma.areaTariff.findMany({
        where,
        orderBy: [{ countryCode: 'asc' }, { imagingType: 'asc' }, { imagingArea: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
  }

  @Post('areas')
  async createAreaTariff(@Headers('authorization') auth: string, @Body() dto: CreateAreaTariffDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.areaTariff.findUnique({
      where: {
        countryCode_imagingType_imagingArea: {
          countryCode: dto.countryCode,
          imagingType: dto.imagingType,
          imagingArea: dto.imagingArea,
        },
      },
    });
    if (existing) throw new BadRequestException('این تعرفه قبلاً ثبت شده است');

    return this.prisma.areaTariff.create({
      data: {
        countryCode: dto.countryCode,
        imagingType: dto.imagingType,
        imagingArea: dto.imagingArea,
        price: dto.price,
        currencyCode: dto.currencyCode ?? 'IRR',
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch('areas/:id')
  async updateAreaTariff(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateAreaTariffDto,
  ) {
    verifyAdmin(auth);
    const tariff = await this.prisma.areaTariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('تعرفه یافت نشد');

    return this.prisma.areaTariff.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('areas/:id')
  async deleteAreaTariff(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const tariff = await this.prisma.areaTariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('تعرفه یافت نشد');

    await this.prisma.areaTariff.delete({ where: { id } });
    return { ok: true };
  }
}
