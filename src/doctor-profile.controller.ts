import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function extractUser(auth?: string): { id: string; name: string; role: string } | null {
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub) return null;
    return { id: payload.sub, name: payload.name ?? '', role: (payload.role as string) ?? 'user' };
  } catch {
    return null;
  }
}

class UpdateProfileDto {
  @IsOptional() @IsString() @Length(0, 100) fullName?: string;
  @IsOptional() @IsString() @Length(0, 200) specialty?: string;
  @IsOptional() @IsString() @Length(0, 200) subSpecialty?: string;
  @IsOptional() @IsString() @Length(0, 100) licenseNumber?: string;
  @IsOptional() @IsString() @Length(0, 5000) biography?: string;
  @IsOptional() @IsString() @Length(0, 5000) education?: string;
  @IsOptional() @IsString() @Length(0, 5000) certifications?: string;
  @IsOptional() @IsInt() @Min(0) @Max(60) experienceYears?: number;
  @IsOptional() @IsString() @Length(0, 500) languages?: string;
  @IsOptional() @IsString() @Length(0, 300) workplace?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxDailyReports?: number;
  @IsOptional() @IsBoolean() notificationEmail?: boolean;
  @IsOptional() @IsBoolean() notificationSms?: boolean;
}

@Controller('dashboard/doctor-profile')
export class DoctorProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getProfile(@Headers('authorization') auth?: string) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const userRow = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true },
    });
    if (!userRow) throw new UnauthorizedException('کاربر یافت نشد');

    const profile = await this.prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: userRow.fullName,
        email: userRow.email,
      },
    });

    const reportCount = await this.prisma.radiologyReport.count({
      where: { authorId: user.id },
    });
    const finalCount = await this.prisma.radiologyReport.count({
      where: { authorId: user.id, status: 'final' },
    });
    const signedCount = await this.prisma.radiologyReport.count({
      where: { authorId: user.id, signed: true },
    });
    const infoRequestCount = await this.prisma.infoRequest.count({
      where: { authorId: user.id },
    });

    return {
      profile,
      stats: {
        totalReports: reportCount,
        finalReports: finalCount,
        signedReports: signedCount,
        infoRequests: infoRequestCount,
      },
    };
  }

  @Patch()
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Headers('authorization') auth?: string,
  ) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const userRow = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true },
    });
    if (!userRow) throw new UnauthorizedException('کاربر یافت نشد');

    const profile = await this.prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: userRow.fullName,
        email: userRow.email,
      },
    });

    const data: Prisma.DoctorProfileUpdateInput = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.specialty !== undefined) data.specialty = body.specialty;
    if (body.subSpecialty !== undefined) data.subSpecialty = body.subSpecialty;
    if (body.licenseNumber !== undefined) data.licenseNumber = body.licenseNumber;
    if (body.biography !== undefined) data.biography = body.biography;
    if (body.education !== undefined) data.education = body.education;
    if (body.certifications !== undefined) data.certifications = body.certifications;
    if (body.experienceYears !== undefined) data.experienceYears = body.experienceYears;
    if (body.languages !== undefined) data.languages = body.languages;
    if (body.workplace !== undefined) data.workplace = body.workplace;
    if (body.maxDailyReports !== undefined) data.maxDailyReports = body.maxDailyReports;
    if (body.notificationEmail !== undefined) data.notificationEmail = body.notificationEmail;
    if (body.notificationSms !== undefined) data.notificationSms = body.notificationSms;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('هیچ فیلدی برای به‌روزرسانی ارسال نشده است');
    }

    return this.prisma.doctorProfile.update({
      where: { userId: user.id },
      data,
    });
  }
}
