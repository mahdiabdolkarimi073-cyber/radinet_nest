import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
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

class DoctorQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class UpdateDoctorDto {
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() subSpecialty?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() workplace?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxDailyReports?: number;
  @IsOptional() @IsInt() @Min(0) tariff?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsIn(['approved', 'pending', 'rejected']) collaborationStatus?: string;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @IsString() education?: string;
  @IsOptional() @IsString() certifications?: string;
  @IsOptional() @IsString() languages?: string;
  @IsOptional() @IsInt() @Min(0) experienceYears?: number;
}

@Controller('admin/doctors')
export class AdminDoctorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listDoctors(@Headers('authorization') auth: string, @Query() query: DoctorQueryDto) {
    verifyAdmin(auth);

    try {
      const missingProfiles = await this.prisma.user.findMany({
        where: {
          role: { in: ['radiologist', 'doctor'] },
          doctorProfile: null,
        },
      });
      for (const u of missingProfiles) {
        await this.prisma.doctorProfile.create({
          data: {
            userId: u.id,
            fullName: u.fullName || u.email,
            email: u.email,
            specialty: 'متخصص رادیولوژی',
            isActive: u.status !== 'inactive' && u.status !== 'suspended',
            collaborationStatus: 'approved',
          },
        }).catch(() => {});
      }
    } catch {
      // ignore
    }

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);

    const where: Prisma.DoctorProfileWhereInput = {};
    if (query.status && query.status !== 'all') {
      if (query.status === 'approved') where.collaborationStatus = 'approved';
      else if (query.status === 'pending') where.collaborationStatus = 'pending';
      else if (query.status === 'rejected') where.collaborationStatus = 'rejected';
      else if (query.status === 'active') where.isActive = true;
      else if (query.status === 'inactive') where.isActive = false;
    }

    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { fullName: { contains: value, mode: 'insensitive' } },
        { email: { contains: value, mode: 'insensitive' } },
        { specialty: { contains: value, mode: 'insensitive' } },
        { workplace: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, doctors] = await Promise.all([
      this.prisma.doctorProfile.count({ where }),
      this.prisma.doctorProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          specialty: true,
          subSpecialty: true,
          licenseNumber: true,
          workplace: true,
          experienceYears: true,
          maxDailyReports: true,
          tariff: true,
          isActive: true,
          collaborationStatus: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, role: true, status: true, country: true },
          },
        },
      }),
    ]);

    const doctorsWithStats = await Promise.all(
      doctors.map(async (doc) => {
        const reportCount = await this.prisma.radiologyReport.count({
          where: { authorId: doc.userId },
        });
        const signedCount = await this.prisma.radiologyReport.count({
          where: { authorId: doc.userId, signed: true },
        });
        const completedCount = await this.prisma.radiologyReport.count({
          where: { authorId: doc.userId, status: 'final' },
        });

        const recentReports = await this.prisma.radiologyReport.findMany({
          where: { authorId: doc.userId, signedAt: { not: null } },
          orderBy: { signedAt: 'desc' },
          take: 20,
          select: { signedAt: true, createdAt: true },
        });

        let avgResponseHours: number | null = null;
        if (recentReports.length > 0) {
          const totalHours = recentReports.reduce((sum, r) => {
            if (r.signedAt && r.createdAt) {
              return sum + (r.signedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
            }
            return sum;
          }, 0);
          avgResponseHours = totalHours / recentReports.length;
        }

        return {
          ...doc,
          stats: {
            totalReports: reportCount,
            signedReports: signedCount,
            completedReports: completedCount,
            avgResponseHours: avgResponseHours !== null ? Math.round(avgResponseHours * 10) / 10 : null,
          },
        };
      }),
    );

    return {
      items: doctorsWithStats,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getDoctor(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, role: true, status: true, country: true, email: true, fullName: true },
        },
      },
    });

    if (!doctor) throw new NotFoundException('پزشک یافت نشد');

    const reports = await this.prisma.radiologyReport.findMany({
      where: { authorId: doctor.userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        status: true,
        signed: true,
        createdAt: true,
        updatedAt: true,
        signedAt: true,
        request: { select: { requestNumber: true, patientFirstName: true, patientLastName: true, imagingType: true } },
      },
    });

    const totalReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId } });
    const signedReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId, signed: true } });
    const completedReports = await this.prisma.radiologyReport.count({ where: { authorId: doctor.userId, status: 'final' } });
    const infoRequestCount = await this.prisma.infoRequest.count({ where: { authorId: doctor.userId } });

    return {
      doctor,
      stats: {
        totalReports,
        signedReports,
        completedReports,
        infoRequests: infoRequestCount,
      },
      recentReports: reports,
    };
  }

  @Patch(':id')
  async updateDoctor(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    verifyAdmin(auth);

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('پزشک یافت نشد');

    const data: Prisma.DoctorProfileUpdateInput = {};
    if (dto.specialty !== undefined) data.specialty = dto.specialty;
    if (dto.subSpecialty !== undefined) data.subSpecialty = dto.subSpecialty;
    if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    if (dto.workplace !== undefined) data.workplace = dto.workplace;
    if (dto.maxDailyReports !== undefined) data.maxDailyReports = dto.maxDailyReports;
    if (dto.tariff !== undefined) data.tariff = dto.tariff;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.collaborationStatus !== undefined) data.collaborationStatus = dto.collaborationStatus;
    if (dto.biography !== undefined) data.biography = dto.biography;
    if (dto.education !== undefined) data.education = dto.education;
    if (dto.certifications !== undefined) data.certifications = dto.certifications;
    if (dto.languages !== undefined) data.languages = dto.languages;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;

    if (Object.keys(data).length === 0) throw new BadRequestException('هیچ فیلدی برای به‌روزرسانی ارسال نشده است');

    return this.prisma.doctorProfile.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        specialty: true,
        subSpecialty: true,
        licenseNumber: true,
        workplace: true,
        experienceYears: true,
        biography: true,
        education: true,
        certifications: true,
        languages: true,
        maxDailyReports: true,
        tariff: true,
        isActive: true,
        collaborationStatus: true,
        updatedAt: true,
      },
    });
  }

  @Patch(':id/approve')
  async approveDoctor(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('پزشک یافت نشد');

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { collaborationStatus: 'approved', isActive: true },
      select: {
        id: true,
        fullName: true,
        collaborationStatus: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  @Patch(':id/reject')
  async rejectDoctor(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('پزشک یافت نشد');

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { collaborationStatus: 'rejected', isActive: false },
      select: {
        id: true,
        fullName: true,
        collaborationStatus: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
