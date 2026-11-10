import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
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

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export class CreateArticleDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  summary!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

@Controller('admin/articles')
export class AdminArticleController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listArticles(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.article.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  @Get(':id')
  async getArticle(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const article = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!article) {
      throw new NotFoundException('مقاله مورد نظر یافت نشد');
    }
    return article;
  }

  @Post()
  async createArticle(
    @Headers('authorization') auth: string,
    @Body() dto: CreateArticleDto,
  ) {
    const adminUser = verifyAdmin(auth);

    let cleanSlug = dto.slug?.trim() || slugify(dto.title);
    if (!cleanSlug) cleanSlug = `article-${Date.now()}`;

    // ensure unique slug
    const existing = await this.prisma.article.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    const isPublished = dto.isPublished ?? true;
    const publishedAt = dto.publishedAt
      ? new Date(dto.publishedAt)
      : isPublished
      ? new Date()
      : null;

    const adminFullName = typeof adminUser.fullName === 'string' ? adminUser.fullName : undefined;

    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug: cleanSlug,
        summary: dto.summary,
        content: dto.content,
        imageUrl: dto.imageUrl ?? '',
        category: dto.category ?? 'عمومی',
        author: dto.author?.trim() || adminFullName || 'تیم تحریریه رادینت',
        isPublished,
        publishedAt,
      },
    });
  }

  @Patch(':id')
  async updateArticle(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    verifyAdmin(auth);

    const existing = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('مقاله مورد نظر یافت نشد');
    }

    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined && dto.slug.trim() !== '') {
      data.slug = slugify(dto.slug);
    }
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.author !== undefined) data.author = dto.author;
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
      if (dto.isPublished && !existing.publishedAt && !dto.publishedAt) {
        data.publishedAt = new Date();
      }
    }
    if (dto.publishedAt !== undefined) {
      data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  @Delete(':id')
  async deleteArticle(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const existing = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('مقاله مورد نظر یافت نشد');
    }
    await this.prisma.article.delete({
      where: { id },
    });
    return { ok: true, message: 'مقاله با موفقیت حذف شد' };
  }
}
