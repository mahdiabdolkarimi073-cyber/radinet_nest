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
} from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function verifyAdmin(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'admin' && payload.role !== 'support_expert') {
      throw new UnauthorizedException('دسترسی مجاز نیست');
    }
    return payload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class CreateFaqDto {
  @IsString() question!: string;
  @IsString() answer!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

class UpdateFaqDto {
  @IsOptional() @IsString() question?: string;
  @IsOptional() @IsString() answer?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

class UpdateSupportContactInfoDto {
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() mobileNumber?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() workingHours?: string;
  @IsOptional() @IsString() emergencyNotice?: string;
}

@Controller('support')
export class SupportFaqController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('faqs')
  async listFaqs(@Query('q') q?: string, @Query('category') category?: string) {
    const where: any = { isPublished: true };
    if (category && category !== 'all') {
      where.category = category;
    }
    if (q?.trim()) {
      where.OR = [
        { question: { contains: q.trim(), mode: 'insensitive' } },
        { answer: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }
    return this.prisma.supportFaq.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Get('contact-info')
  async getContactInfo() {
    let info = await this.prisma.supportContactInfo.findFirst();
    if (!info) {
      info = await this.prisma.supportContactInfo.create({
        data: {
          heroTitle: 'مرکز پشتیبانی و راهنمایی رادینت',
          heroSubtitle: 'کارشناسان و متخصصان فنی رادینت در تمامی ساعات در کنار شما هستند.',
          phoneNumber: '۰۲۱-۸۸۸۸۱۹۲۰',
          mobileNumber: '۰۹۱۲۰۵۴۵۶۷۸',
          email: 'support@radinet.ir',
          workingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰ | پنج‌شنبه‌ها ۸:۰۰ الی ۱۳:۰۰',
          emergencyNotice: 'واحد تله‌ریپورت اورژانس و پشتیبانی سرورهای ابری به صورت ۲۴ ساعته فعال است.',
        },
      });
    }
    return info;
  }

  @Get('bundle')
  async getBundle() {
    const [contactInfo, faqs] = await Promise.all([
      this.getContactInfo(),
      this.listFaqs(),
    ]);

    const categories = Array.from(new Set(faqs.map((f: { category: string }) => f.category))).filter(Boolean);

    return {
      contact_info: {
        id: contactInfo.id,
        hero_title: contactInfo.heroTitle,
        hero_subtitle: contactInfo.heroSubtitle,
        phone_number: contactInfo.phoneNumber,
        mobile_number: contactInfo.mobileNumber,
        email: contactInfo.email,
        working_hours: contactInfo.workingHours,
        emergency_notice: contactInfo.emergencyNotice,
        updated_at: contactInfo.updatedAt.toISOString(),
      },
      faqs: faqs.map((f: any) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        display_order: f.displayOrder,
        is_published: f.isPublished,
        created_at: f.createdAt.toISOString(),
        updated_at: f.updatedAt.toISOString(),
      })),
      categories: categories.length > 0 ? categories : ['تله‌رادیولوژی', 'فنی و پکس', 'مالی و تعرفه', 'عمومی'],
    };
  }

  // ── Admin Management Routes ──

  @Get('admin/faqs')
  async adminListFaqs(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.supportFaq.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Post('admin/faqs')
  async createFaq(@Headers('authorization') auth: string, @Body() dto: CreateFaqDto) {
    verifyAdmin(auth);
    return this.prisma.supportFaq.create({
      data: {
        question: dto.question.trim(),
        answer: dto.answer.trim(),
        category: dto.category?.trim() || 'general',
        displayOrder: dto.displayOrder ?? 0,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  @Patch('admin/faqs/:id')
  async updateFaq(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
  ) {
    verifyAdmin(auth);
    const existing = await this.prisma.supportFaq.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('سوال متداول یافت نشد');
    return this.prisma.supportFaq.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('admin/faqs/:id')
  async deleteFaq(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const existing = await this.prisma.supportFaq.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('سوال متداول یافت نشد');
    await this.prisma.supportFaq.delete({ where: { id } });
    return { ok: true, message: 'سوال متداول با موفقیت حذف شد' };
  }

  @Patch('admin/contact-info')
  async updateContactInfo(
    @Headers('authorization') auth: string,
    @Body() dto: UpdateSupportContactInfoDto,
  ) {
    verifyAdmin(auth);
    const existing = await this.prisma.supportContactInfo.findFirst();
    if (existing) {
      return this.prisma.supportContactInfo.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return this.prisma.supportContactInfo.create({
      data: {
        heroTitle: dto.heroTitle ?? 'مرکز پشتیبانی و راهنمایی رادینت',
        heroSubtitle: dto.heroSubtitle ?? 'کارشناسان و متخصصان فنی رادینت در تمامی ساعات در کنار شما هستند.',
        phoneNumber: dto.phoneNumber ?? '۰۲۱-۸۸۸۸۱۹۲۰',
        mobileNumber: dto.mobileNumber ?? '۰۹۱۲۰۵۴۵۶۷۸',
        email: dto.email ?? 'support@radinet.ir',
        workingHours: dto.workingHours ?? 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰',
        emergencyNotice: dto.emergencyNotice ?? 'واحد تله‌ریپورت اورژانس ۲۴/۷ فعال است.',
      },
    });
  }
}
