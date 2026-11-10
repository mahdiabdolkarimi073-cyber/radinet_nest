import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import * as jwt from 'jsonwebtoken';
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

const VALID_PAGE_KEYS = ['home', 'about', 'contact', 'legal', 'privacy'] as const;
type PageKey = (typeof VALID_PAGE_KEYS)[number];

class UpdatePageContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listPages(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.publicPageContent.findMany({
      orderBy: [{ pageKey: 'asc' }],
    });
  }

  @Get(':pageKey')
  async getPage(@Headers('authorization') auth: string, @Param('pageKey') pageKey: string) {
    verifyAdmin(auth);

    if (!VALID_PAGE_KEYS.includes(pageKey as PageKey)) {
      throw new NotFoundException('صفحه نامعتبر است');
    }

    let page = await this.prisma.publicPageContent.findUnique({
      where: { pageKey },
    });

    if (!page) {
      const defaults: Record<string, { title: string; subtitle: string }> = {
        home: { title: 'صفحه اصلی', subtitle: 'خوش آمدید به رادینت' },
        about: { title: 'درباره ما', subtitle: 'درباره رادینت رادیولوژی' },
        contact: { title: 'تماس با ما', subtitle: 'با ما در ارتباط باشید' },
        legal: { title: 'قوانین و مقررات', subtitle: 'قوانین و شرایط استفاده' },
        privacy: { title: 'حریم خصوصی', subtitle: 'سیاست حفظ حریم خصوصی' },
      };
      const def = defaults[pageKey];
      page = await this.prisma.publicPageContent.create({
        data: {
          pageKey,
          title: def.title,
          subtitle: def.subtitle,
        },
      });
    }

    return page;
  }

  @Patch(':pageKey')
  async updatePage(
    @Headers('authorization') auth: string,
    @Param('pageKey') pageKey: string,
    @Body() dto: UpdatePageContentDto,
  ) {
    verifyAdmin(auth);

    if (!VALID_PAGE_KEYS.includes(pageKey as PageKey)) {
      throw new NotFoundException('صفحه نامعتبر است');
    }

    let page = await this.prisma.publicPageContent.findUnique({
      where: { pageKey },
    });

    if (!page) {
      const defaults: Record<string, { title: string; subtitle: string }> = {
        home: { title: 'صفحه اصلی', subtitle: 'خوش آمدید به رادینت' },
        about: { title: 'درباره ما', subtitle: 'درباره رادینت رادیولوژی' },
        contact: { title: 'تماس با ما', subtitle: 'با ما در ارتباط باشید' },
        legal: { title: 'قوانین و مقررات', subtitle: 'قوانین و شرایط استفاده' },
        privacy: { title: 'حریم خصوصی', subtitle: 'سیاست حفظ حریم خصوصی' },
      };
      const def = defaults[pageKey];
      page = await this.prisma.publicPageContent.create({
        data: {
          pageKey,
          title: dto.title ?? def.title,
          subtitle: dto.subtitle ?? def.subtitle,
          content: dto.content ?? '',
          metaDescription: dto.metaDescription ?? '',
          isActive: dto.isActive ?? true,
        },
      });
      return page;
    }

    return this.prisma.publicPageContent.update({
      where: { pageKey },
      data: dto,
    });
  }
}
