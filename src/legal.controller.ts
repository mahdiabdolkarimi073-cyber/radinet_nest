import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from './prisma.service';

class LegalDocumentDto {
  @IsString() documentType!: string;
  @IsString() title!: string;
  @IsString() content!: string;
  @IsOptional() @IsInt() @Min(1) versionNumber?: number;
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() scheduledPublishDate?: string;
}

class ChangeLogDto {
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsString() actor!: string;
  @IsString() action!: string;
  @IsOptional() @IsString() summary?: string;
}

class ConsentDto {
  @IsString() userIdentifier!: string;
  @IsString() documentType!: string;
  @IsInt() documentVersion!: number;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() userAgent?: string;
}

@Controller('legal')
export class LegalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':type')
  async getDocument(@Param('type') type: string) {
    const doc = await this.prisma.legalDocument.findFirst({
      where: { documentType: type, isActive: true },
    });
    return doc ?? null;
  }

  @Get()
  async getAllDocuments() {
    return this.prisma.legalDocument.findMany({ where: { isActive: true } });
  }

  @Post()
  async createDocument(@Body() body: LegalDocumentDto) {
    await this.prisma.legalDocument.updateMany({
      where: { documentType: body.documentType, isActive: true },
      data: { isActive: false },
    });
    const doc = await this.prisma.legalDocument.create({ data: body });
    await this.prisma.legalChangeLog.create({
      data: {
        documentId: doc.id,
        documentType: body.documentType,
        actor: 'admin',
        action: 'create',
        summary: `نسخه ${body.versionNumber ?? 1} از سند ${body.documentType} ایجاد شد`,
      },
    });
    return doc;
  }

  @Patch(':id')
  async updateDocument(@Param('id') id: string, @Body() body: Partial<LegalDocumentDto>) {
    const existing = await this.prisma.legalDocument.findUnique({ where: { id } });
    if (!existing) return null;
    if (existing.versionNumber !== body.versionNumber) {
      await this.prisma.legalDocumentVersion.create({
        data: {
          documentId: existing.id,
          documentType: existing.documentType,
          title: existing.title,
          content: existing.content,
          versionNumber: existing.versionNumber,
          effectiveDate: existing.effectiveDate,
        },
      });
    }
    const doc = await this.prisma.legalDocument.update({ where: { id }, data: body });
    await this.prisma.legalChangeLog.create({
      data: {
        documentId: id,
        documentType: existing.documentType,
        actor: 'admin',
        action: 'update',
        summary: `سند ${existing.documentType} به نسخه ${body.versionNumber ?? existing.versionNumber} بروزرسانی شد`,
      },
    });
    return doc;
  }

  @Get('versions/:type')
  async getVersions(@Param('type') type: string) {
    return this.prisma.legalDocumentVersion.findMany({
      where: { documentType: type },
      orderBy: { archivedAt: 'desc' },
    });
  }

  @Get('logs/changes')
  async getChangeLogs() {
    return this.prisma.legalChangeLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  @Post('logs/changes')
  async createChangeLog(@Body() body: ChangeLogDto) {
    return this.prisma.legalChangeLog.create({ data: body });
  }

  @Post('consents')
  async recordConsent(@Body() body: ConsentDto) {
    return this.prisma.legalConsent.create({ data: body });
  }

  @Get('consents/:identifier')
  async getConsents(@Param('identifier') identifier: string) {
    return this.prisma.legalConsent.findMany({
      where: { userIdentifier: identifier },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  @Get('logs/views')
  async getViewLogs() {
    return this.prisma.legalViewLog.findMany({ orderBy: { viewedAt: 'desc' }, take: 100 });
  }
}
