import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function extractUserId(auth?: string): { id: string; role: string } | null {
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub) return null;
    return { id: payload.sub, role: (payload.role as string) ?? 'user' };
  } catch {
    return null;
  }
}

@Controller('dashboard/patients')
export class PatientFileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listPatients(
    @Query('status') status?: string,
    @Query('imagingType') imagingType?: string,
    @Query('search') search?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
    const where: Prisma.TeleReportRequestWhereInput = {};

    if (status && status !== 'all') where.status = status;
    if (imagingType && imagingType !== 'all') where.imagingType = imagingType;
    if (search?.trim()) {
      const value = search.trim();
      where.OR = [
        { requestNumber: { contains: value, mode: 'insensitive' } },
        { patientFirstName: { contains: value, mode: 'insensitive' } },
        { patientLastName: { contains: value, mode: 'insensitive' } },
        { nationalId: { contains: value, mode: 'insensitive' } },
        { phone: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, patients] = await Promise.all([
      this.prisma.teleReportRequest.count({ where }),
      this.prisma.teleReportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          nationalId: true,
          phone: true,
          age: true,
          gender: true,
          country: true,
          city: true,
          imagingType: true,
          imagingArea: true,
          status: true,
          createdAt: true,
          _count: { select: { reports: true } },
        },
      }),
    ]);

    return {
      items: patients,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getPatientFile(@Param('id') id: string, @Headers('authorization') auth?: string) {
    const authUser = extractUserId(auth);
    if (!authUser) throw new UnauthorizedException('احراز هویت الزامی است');
    if (authUser.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
    const userId = authUser.id;

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          include: {
            author: { select: { id: true, fullName: true } },
            images: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) throw new BadRequestException('پرونده بیمار پیدا نشد');

    return {
      patient: {
        id: request.id,
        requestNumber: request.requestNumber,
        firstName: request.patientFirstName,
        lastName: request.patientLastName,
        nationalId: request.nationalId,
        passportNumber: request.passportNumber,
        phone: request.phone,
        age: request.age,
        gender: request.gender,
        country: request.country,
        city: request.city,
        language: request.language,
      },
      clinical: {
        clinicalHistory: request.clinicalHistory,
        symptoms: request.symptoms,
        imagingType: request.imagingType,
        imagingArea: request.imagingArea,
        studyDate: request.studyDate,
        pacsUrl: request.pacsUrl,
        cloudUrl: request.cloudUrl,
        referralPath: request.referralPath,
        referredAt: request.referredAt,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
      attachments: request.attachments.map((att) => ({
        id: att.id,
        originalName: att.originalName,
        storedName: att.storedName,
        mimeType: att.mimeType,
        size: att.size,
        storagePath: att.storagePath,
        createdAt: att.createdAt,
      })),
      reports: request.reports.map((report) => ({
        id: report.id,
        status: report.status,
        signed: report.signed,
        signatureName: report.signatureName,
        signedAt: report.signedAt,
        authorName: report.author?.fullName ?? null,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    };
  }
}
