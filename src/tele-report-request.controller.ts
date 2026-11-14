import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { Body, Controller, Get, Headers, Param, Patch, Post, UseInterceptors, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Allow, IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  MultipartUploadInterceptor,
  UploadedMultipartFiles,
  type StoredUploadFile,
} from './multipart-upload';
import { PrismaService } from './prisma.service';
import {
  cleanupUploadedFiles,
  parseOptionalNonNegativeNumber,
  parseOptionalValidDate,
  parseValidatedAge,
} from './tele-report-validation';

const uploadDirectory = join(process.cwd(), 'uploads', 'tele-report');
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/dicom',
  'application/octet-stream',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.dicom']);

mkdirSync(uploadDirectory, { recursive: true });

class CheckPatientDto {
  @IsString() @Length(10, 10) nationalId!: string;
}

class CreateTeleReportRequestDto {
  @IsOptional() @IsString() requestNumber?: string;
  @IsString() @Length(2, 80) country!: string;
  @IsString() @Length(2, 40) language!: string;
  @IsString() @Length(2, 80) patientFirstName!: string;
  @IsString() @Length(2, 80) patientLastName!: string;
  @IsOptional() @IsString() @Length(0, 30) nationalId?: string;
  @IsOptional() @IsString() @Length(0, 40) passportNumber?: string;
  @IsString() @Length(7, 30) phone!: string;
  @IsString() @Length(2, 80) city!: string;
  @Allow() age?: number | string;
  @IsString() @IsIn(['male', 'female']) gender!: string;
  @IsString() @Length(2, 5000) clinicalHistory!: string;
  @IsString() @Length(2, 5000) symptoms!: string;
  @IsString() @Length(2, 100) imagingType!: string;
  @IsString() @Length(2, 120) imagingArea!: string;
  @IsOptional() @Allow() studyDate?: string;
  @IsOptional() @IsString() @Length(0, 2000) pacsUrl?: string;
  @IsOptional() @IsString() @Length(0, 2000) cloudUrl?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() idempotencyKey?: string;
  @IsOptional() @Allow() aiAnalysisResult?: unknown;
  @IsOptional() @Allow() aiSuggestedPrice?: number | string;
  @IsOptional() @Allow() aiConfirmedAt?: string;
  @IsOptional() @Allow() attachments?: unknown;
}

class SetReferralPathDto {
  @IsString() @IsIn(['auto', 'smart', 'manual']) referralPath!: string;
}

@Controller('tele-report/requests')
export class TeleReportRequestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('check-patient')
  async checkPatientGet(@Body() body?: { nationalId?: string }) {
    if (!body?.nationalId) return { exists: false, hasHistory: false };
    const patient = await this.prisma.teleReportRequest.findFirst({
      where: { nationalId: body.nationalId.trim() },
      select: { id: true },
    });
    return { exists: Boolean(patient), hasHistory: Boolean(patient) };
  }

  @Post('check-patient')
  async checkPatient(@Body() body: CheckPatientDto) {
    const patient = await this.prisma.teleReportRequest.findFirst({
      where: { nationalId: body.nationalId.trim() },
      select: { id: true },
    });
    return { exists: Boolean(patient), hasHistory: Boolean(patient) };
  }

  @Post()
  @UseInterceptors(
    new MultipartUploadInterceptor({
      fieldName: 'files',
      destination: uploadDirectory,
      maxFiles: 20,
      maxFileSize: 25 * 1024 * 1024,
      maxFieldSize: 2 * 1024 * 1024,
      allowedMimeTypes,
      allowedExtensions,
      invalidFileMessage: 'فرمت فایل مجاز نیست',
    }),
  )
  async create(
    @Headers('authorization') auth: string | undefined,
    @Body() body: CreateTeleReportRequestDto,
    @UploadedMultipartFiles() files: StoredUploadFile[] = [],
  ) {
    try {
      const validatedAge = parseValidatedAge(body.age, { required: true });

      if (!body.nationalId?.trim() && !body.passportNumber?.trim()) {
        throw new BadRequestException('کد ملی یا شماره پاسپورت الزامی است');
      }
      if (!body.pacsUrl?.trim() && !body.cloudUrl?.trim() && files.length === 0) {
        throw new BadRequestException('حداقل یک فایل یا لینک تصویربرداری وارد کنید');
      }

      const validatedStudyDate = parseOptionalValidDate(body.studyDate, 'تاریخ تصویربرداری');
      const validatedAiConfirmedAt = parseOptionalValidDate(
        body.aiConfirmedAt,
        'زمان تأیید تحلیل هوش مصنوعی',
      );

      let parsedAi: unknown = undefined;
      if (typeof body.aiAnalysisResult === 'string' && body.aiAnalysisResult.trim()) {
        try {
          parsedAi = JSON.parse(body.aiAnalysisResult);
        } catch {
          throw new BadRequestException('فرمت نتیجه تحلیل هوش مصنوعی نامعتبر است');
        }
      } else if (body.aiAnalysisResult && typeof body.aiAnalysisResult === 'object') {
        parsedAi = body.aiAnalysisResult;
      }

      const aiPriceRaw =
        body.aiSuggestedPrice !== undefined && body.aiSuggestedPrice !== ''
          ? body.aiSuggestedPrice
          : (parsedAi as Record<string, unknown> | undefined)?.suggestedPrice;
      const aiSuggestedPrice = parseOptionalNonNegativeNumber(
        aiPriceRaw,
        'مبلغ پیشنهادی هوش مصنوعی',
      );

      if (body.idempotencyKey?.trim()) {
        const existing = await this.prisma.teleReportRequest.findUnique({
          where: { idempotencyKey: body.idempotencyKey.trim() },
        });
        if (existing) {
          await cleanupUploadedFiles(files);
          return {
            id: existing.id,
            requestNumber: existing.requestNumber,
            status: existing.status,
            createdAt: existing.createdAt,
          };
        }
      }

      const isUuid = (v?: string | null) =>
        Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()));
      let resolvedUserId: string | null = isUuid(body.userId) ? body.userId!.trim() : null;
      if (!resolvedUserId && auth?.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(
            auth.slice(7),
            process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me',
          ) as jwt.JwtPayload;
          if (typeof decoded.sub === 'string' && isUuid(decoded.sub)) resolvedUserId = decoded.sub;
        } catch {}
      }

      const requestNumber =
        body.requestNumber?.trim() ||
        `TR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      const request = await this.prisma.teleReportRequest.create({
        data: {
          requestNumber,
          userId: resolvedUserId,
          country: body.country.trim(),
          language: body.language.trim(),
          patientFirstName: body.patientFirstName.trim(),
          patientLastName: body.patientLastName.trim(),
          nationalId: body.nationalId?.trim() || null,
          passportNumber: body.passportNumber?.trim() || null,
          phone: body.phone.trim(),
          city: body.city.trim(),
          age: validatedAge,
          gender: body.gender,
          clinicalHistory: body.clinicalHistory.trim(),
          symptoms: body.symptoms.trim(),
          imagingType: body.imagingType.trim(),
          imagingArea: body.imagingArea.trim(),
          studyDate: validatedStudyDate,
          pacsUrl: body.pacsUrl?.trim() || null,
          cloudUrl: body.cloudUrl?.trim() || null,
          idempotencyKey: body.idempotencyKey?.trim() || null,
          aiAnalysisResult: parsedAi !== undefined ? (parsedAi as never) : undefined,
          aiSuggestedPrice,
          aiConfirmedAt: validatedAiConfirmedAt,
          status: 'pending_payment',
          paymentStatus: 'unpaid',
          attachments: files.length
            ? {
                create: files.map((file) => ({
                  originalName: file.originalname,
                  storedName: file.filename,
                  mimeType: file.mimetype,
                  size: file.size,
                  storagePath: file.path,
                })),
              }
            : undefined,
        },
        include: { attachments: true },
      });

      return {
        id: request.id,
        requestNumber: request.requestNumber,
        status: request.status,
        createdAt: request.createdAt,
      };
    } catch (error) {
      await cleanupUploadedFiles(files);
      throw error;
    }
  }

  @Get(':requestNumber')
  async findOne(@Param('requestNumber') requestNumber: string) {
    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber },
    });
    if (!request) throw new BadRequestException('درخواست پیدا نشد');
    return request;
  }

  @Patch(':requestNumber/referral-path')
  async setReferralPath(
    @Param('requestNumber') requestNumber: string,
    @Body() body: SetReferralPathDto,
  ) {
    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber },
      select: { id: true, status: true },
    });
    if (!request) throw new BadRequestException('درخواست پیدا نشد');

    if (body.referralPath !== 'auto') {
      throw new BadRequestException('مسیر انتخاب‌شده در حال حاضر قابل دسترسی نیست. در توسعه آینده امکان‌دسترسی خواهد بود.');
    }

    const updated = await this.prisma.teleReportRequest.update({
      where: { requestNumber },
      data: {
        referralPath: body.referralPath,
        referredAt: new Date(),
        status: 'referred',
      },
      select: { requestNumber: true, status: true, referralPath: true, referredAt: true },
    });

    return {
      requestNumber: updated.requestNumber,
      status: updated.status,
      referralPath: updated.referralPath,
      referredAt: updated.referredAt,
      message: 'ارجاع با موفقیت ثبت شد. تیم رادینت درخواست شما را دریافت کرد و به‌زودی گزارش را آماده خواهد کرد.',
    };
  }
}
