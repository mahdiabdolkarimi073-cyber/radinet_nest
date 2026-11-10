import { mkdirSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import {
  MultipartUploadInterceptor,
  UploadedMultipartFiles,
  type StoredUploadFile,
} from './multipart-upload';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
const reportUploadDir = join(process.cwd(), 'uploads', 'report-images');

mkdirSync(reportUploadDir, { recursive: true });

const allowedImageMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function extractUserId(auth?: string): { id: string; name: string; role: string } | null {
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub) return null;
    return { id: payload.sub, name: payload.name ?? '', role: (payload.role as string) ?? 'user' };
  } catch {
    return null;
  }
}

class CreateReportDto {
  @IsString() @Length(1, 36) requestId!: string;
  @IsOptional() @IsString() @Length(0, 20000) findings?: string;
  @IsOptional() @IsString() @Length(0, 10000) conclusion?: string;
}

class UpdateReportDto {
  @IsOptional() @IsString() @Length(0, 20000) findings?: string;
  @IsOptional() @IsString() @Length(0, 10000) conclusion?: string;
}

class SignReportDto {
  @IsBoolean() signed!: boolean;
  @IsOptional() @IsString() @Length(2, 100) signatureName?: string;
}

class SubmitReportDto {
  @IsString() @Length(0, 20000) findings!: string;
  @IsString() @Length(0, 10000) conclusion!: string;
  @IsBoolean() signed!: boolean;
  @IsOptional() @IsString() @Length(2, 100) signatureName?: string;
}

@Controller('dashboard/reports')
export class ReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listReports(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
    const where: Prisma.RadiologyReportWhereInput = {};

    if (status && status !== 'all') where.status = status;
    if (search?.trim()) {
      const value = search.trim();
      where.OR = [
        { findings: { contains: value, mode: 'insensitive' } },
        { conclusion: { contains: value, mode: 'insensitive' } },
        { request: { requestNumber: { contains: value, mode: 'insensitive' } } },
        { request: { patientFirstName: { contains: value, mode: 'insensitive' } } },
        { request: { patientLastName: { contains: value, mode: 'insensitive' } } },
      ];
    }

    const [total, reports] = await Promise.all([
      this.prisma.radiologyReport.count({ where }),
      this.prisma.radiologyReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, fullName: true } },
          request: {
            select: {
              id: true,
              requestNumber: true,
              patientFirstName: true,
              patientLastName: true,
              imagingType: true,
              imagingArea: true,
            },
          },
        },
      }),
    ]);

    return {
      items: reports,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get('by-request/:requestId')
  async getReportsByRequest(@Param('requestId') requestId: string) {
    const reports = await this.prisma.radiologyReport.findMany({
      where: { requestId },
      include: {
        author: { select: { id: true, fullName: true } },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items: reports };
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    const report = await this.prisma.radiologyReport.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, fullName: true } },
        images: { orderBy: { createdAt: 'asc' } },
        request: {
          select: {
            id: true,
            requestNumber: true,
            patientFirstName: true,
            patientLastName: true,
            imagingType: true,
            imagingArea: true,
          },
        },
      },
    });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');
    return report;
  }

  @Post()
  async createReport(@Body() body: CreateReportDto, @Headers('authorization') auth?: string) {
    const user = extractUserId(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id: body.requestId },
      select: { id: true },
    });
    if (!request) throw new BadRequestException('درخواست بیمار پیدا نشد');

    return this.prisma.radiologyReport.create({
      data: {
        requestId: body.requestId,
        authorId: user.id,
        findings: body.findings ?? '',
        conclusion: body.conclusion ?? '',
        status: 'draft',
      },
      include: { images: true },
    });
  }

  @Patch(':id')
  async updateReport(@Param('id') id: string, @Body() body: UpdateReportDto) {
    const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');
    if (report.status === 'final' || report.status === 'approved') {
      throw new BadRequestException('گزارش تأیید نهایی شده و قابل ویرایش نیست');
    }

    return this.prisma.radiologyReport.update({
      where: { id },
      data: {
        ...(body.findings !== undefined ? { findings: body.findings } : {}),
        ...(body.conclusion !== undefined ? { conclusion: body.conclusion } : {}),
      },
      include: { images: true },
    });
  }

  @Post(':id/sign')
  async signReport(@Param('id') id: string, @Body() body: SignReportDto, @Headers('authorization') auth?: string) {
    const user = extractUserId(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist' && user.role !== 'doctor' && user.role !== 'admin') {
      throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
    }

    const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');

    return this.prisma.radiologyReport.update({
      where: { id },
      data: {
        signed: body.signed,
        signatureName: body.signed ? (body.signatureName ?? user.name) : null,
        signedAt: body.signed ? new Date() : null,
      },
    });
  }

  @Post(':id/submit')
  async submitReport(@Param('id') id: string, @Body() body: SubmitReportDto, @Headers('authorization') auth?: string) {
    const user = extractUserId(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist' && user.role !== 'doctor' && user.role !== 'admin') {
      throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
    }

    const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');
    if (report.status === 'final' || report.status === 'approved') {
      throw new BadRequestException('گزارش قبلاً تأیید نهایی شده است');
    }

    const updated = await this.prisma.radiologyReport.update({
      where: { id },
      data: {
        findings: body.findings,
        conclusion: body.conclusion,
        status: 'pending_approval',
        adminApprovalStatus: 'pending',
        supportApprovalStatus: 'pending',
        rejectReason: null,
        signed: body.signed,
        signatureName: body.signed ? (body.signatureName ?? user.name) : null,
        signedAt: body.signed ? new Date() : null,
      },
      include: {
        images: true,
        request: {
          select: {
            id: true,
            requestNumber: true,
            patientFirstName: true,
            patientLastName: true,
          },
        },
      },
    });

    await this.prisma.teleReportRequest.update({
      where: { id: report.requestId },
      data: { status: 'pending_approval' },
    });

    return updated;
  }

  @Post(':id/images')
  @UseInterceptors(
    new MultipartUploadInterceptor({
      fieldName: 'images',
      destination: reportUploadDir,
      maxFiles: 10,
      maxFileSize: 15 * 1024 * 1024,
      allowedMimeTypes: allowedImageMime,
      allowedExtensions: allowedImageExt,
      invalidFileMessage: 'فقط فایل‌های تصویری JPEG، PNG و WebP مجاز هستند',
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedMultipartFiles() files: StoredUploadFile[] = [],
  ) {
    const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');
    if (report.status === 'final') throw new BadRequestException('گزارش نهایی قابل تغییر نیست');

    if (!files.length) throw new BadRequestException('هیچ فایلی ارسال نشد');

    const images = await Promise.all(
      files.map((file) =>
        this.prisma.radiologyReportImage.create({
          data: {
            reportId: id,
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            storagePath: file.path,
          },
        }),
      ),
    );

    return { images };
  }

  @Post(':id/images/:imageId/delete')
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const report = await this.prisma.radiologyReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('گزارش پیدا نشد');
    if (report.status === 'final') throw new BadRequestException('گزارش نهایی قابل تغییر نیست');

    await this.prisma.radiologyReportImage.delete({
      where: { id: imageId },
    });

    return { ok: true };
  }
}
