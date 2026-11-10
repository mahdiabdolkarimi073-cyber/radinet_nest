import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class TelereportQueryDto { @IsOptional() @IsString() status?: string; @IsOptional() @IsString() search?: string; }
class StatusDto { @IsIn(['new', 'pending', 'assigned', 'in_progress', 'coordinating', 'scheduled', 'completed', 'cancelled']) status!: string; }
class NotifyDto { @IsIn(['patient', 'doctor', 'both']) recipient!: string; @IsString() @MinLength(1) message!: string; }
class CoordinateDto { @IsOptional() @IsString() notes?: string; @IsOptional() @IsString() scheduledAt?: string; }
class AssignDoctorDto {
  @IsString() doctorId!: string;
  @IsOptional() @IsString() requestNumber?: string;
  @IsOptional() @IsString() localId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() patientLastName?: string;
}
class ReviewReportDto {
  @IsString() reportId!: string;
  @IsIn(['approved', 'rejected']) decision!: 'approved' | 'rejected';
  @IsOptional() @IsString() rejectReason?: string;
}

@Controller('support/telereports')
@UseGuards(SupportExpertGuard)
export class SupportTelereportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Headers('authorization') auth: string, @Query() query: TelereportQueryDto) {
    verifySupportToken(auth);
    return this.prisma.teleReportRequest.findMany({
      where: {
        ...(query.status && query.status !== 'all' ? { status: query.status } : {}),
        ...(query.search?.trim()
          ? {
              OR: [
                { requestNumber: { contains: query.search.trim(), mode: 'insensitive' } },
                { patientFirstName: { contains: query.search.trim(), mode: 'insensitive' } },
                { patientLastName: { contains: query.search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        reports: {
          select: {
            id: true,
            status: true,
            signed: true,
            authorId: true,
            author: { select: { id: true, fullName: true } },
          },
        },
        _count: { select: { attachments: true, infoRequests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('doctors')
  async listDoctors(@Headers('authorization') auth: string) {
    verifySupportToken(auth);
    const [profiles, doctorUsers] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where: { isActive: true },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.user.findMany({
        where: { role: { in: ['radiologist', 'doctor'] }, status: 'active' },
        select: { id: true, fullName: true, email: true },
      }),
    ]);
    const map = new Map<string, any>();
    const seenEmails = new Set<string>();

    for (const p of profiles) {
      const id = p.userId || p.id;
      const email = (p.email || p.user?.email || '').trim().toLowerCase();
      map.set(id, {
        id: p.id,
        userId: p.userId,
        fullName: p.fullName || p.user?.fullName || 'پزشک رادیولوژیست',
        email: p.email || p.user?.email || '',
        specialty: p.specialty || 'متخصص رادیولوژی و تله‌ریپورت',
      });
      if (email) seenEmails.add(email);
    }
    for (const u of doctorUsers) {
      const email = (u.email || '').trim().toLowerCase();
      if (!map.has(u.id) && (!email || !seenEmails.has(email))) {
        map.set(u.id, {
          id: u.id,
          userId: u.id,
          fullName: u.fullName || u.email,
          email: u.email || '',
          specialty: 'متخصص رادیولوژی و تله‌ریپورت',
        });
        if (email) seenEmails.add(email);
      }
    }
    return Array.from(map.values());
  }

  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const request = await this.prisma.teleReportRequest.findFirst({
      where: isUuid(cleanId)
        ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
        : {
            OR: [
              { requestNumber: cleanId },
              { requestNumber: { equals: cleanId, mode: 'insensitive' } },
            ],
          },
      include: {
        attachments: true,
        reports: { include: { author: { select: { id: true, fullName: true, email: true } } } },
        infoRequests: true,
      },
    });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    const notifications = await this.prisma.telereportNotification.findMany({
      where: { requestId: request.id },
      orderBy: { sentAt: 'desc' },
    });
    return { ...request, notifications };
  }

  @Patch(':id/status')
  async status(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: StatusDto) {
    verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const request = await this.prisma.teleReportRequest.findFirst({
      where: isUuid(cleanId)
        ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
        : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
    });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    return this.prisma.teleReportRequest.update({ where: { id: request.id }, data: { status: dto.status } });
  }

  @Patch(':id/assign-doctor')
  async assignDoctor(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: AssignDoctorDto) {
    verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const reqNum = String(dto.requestNumber || '').trim();
    const localId = String(dto.localId || '').trim();

    const whereOr: Prisma.TeleReportRequestWhereInput[] = [];
    if (isUuid(cleanId)) whereOr.push({ id: cleanId });
    if (cleanId) {
      whereOr.push(
        { requestNumber: cleanId },
        { requestNumber: { equals: cleanId, mode: 'insensitive' } },
        { requestNumber: { contains: cleanId, mode: 'insensitive' } },
      );
    }
    if (reqNum && reqNum !== cleanId) {
      if (isUuid(reqNum)) whereOr.push({ id: reqNum });
      whereOr.push(
        { requestNumber: reqNum },
        { requestNumber: { equals: reqNum, mode: 'insensitive' } },
      );
    }
    if (localId && localId !== cleanId && localId !== reqNum) {
      if (isUuid(localId)) whereOr.push({ id: localId });
      whereOr.push({ requestNumber: localId });
    }

    let request = await this.prisma.teleReportRequest.findFirst({
      where: { OR: whereOr },
    });

    if (!request && (dto.phone || dto.patientLastName)) {
      request = await this.prisma.teleReportRequest.findFirst({
        where: {
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
          ...(dto.patientLastName ? { patientLastName: { contains: dto.patientLastName.trim(), mode: 'insensitive' } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');

    const rawId = String(dto.doctorId || '').trim();
    const cleanId = rawId.startsWith('doc-') ? rawId.replace('doc-', '') : rawId;

    // Safely query DoctorProfile without crashing on non-UUID strings
    const profileOr: Prisma.DoctorProfileWhereInput[] = [];
    if (isUuid(rawId)) profileOr.push({ id: rawId }, { userId: rawId });
    if (isUuid(cleanId) && cleanId !== rawId) profileOr.push({ id: cleanId }, { userId: cleanId });
    if (rawId) {
      profileOr.push(
        { email: { equals: rawId, mode: 'insensitive' } },
        { fullName: { equals: rawId, mode: 'insensitive' } }
      );
    }
    if (cleanId && cleanId !== rawId) {
      profileOr.push(
        { email: { equals: cleanId, mode: 'insensitive' } },
        { fullName: { equals: cleanId, mode: 'insensitive' } }
      );
    }

    let doctor = profileOr.length > 0
      ? await this.prisma.doctorProfile.findFirst({
          where: { OR: profileOr },
          include: { user: true },
        })
      : null;

    if (!doctor) {
      // Look up in User table for radiologist role
      const userOr: Prisma.UserWhereInput[] = [];
      if (isUuid(rawId)) userOr.push({ id: rawId });
      if (isUuid(cleanId) && cleanId !== rawId) userOr.push({ id: cleanId });
      if (rawId) {
        userOr.push(
          { email: { equals: rawId, mode: 'insensitive' } },
          { fullName: { equals: rawId, mode: 'insensitive' } }
        );
      }
      if (cleanId && cleanId !== rawId) {
        userOr.push(
          { email: { equals: cleanId, mode: 'insensitive' } },
          { fullName: { equals: cleanId, mode: 'insensitive' } }
        );
      }

      const user = userOr.length > 0
        ? await this.prisma.user.findFirst({
            where: {
              OR: userOr,
              role: { in: ['radiologist', 'doctor', 'RADIOLOGIST', 'DOCTOR'] },
            },
          })
        : null;

      if (user) {
        doctor = await this.prisma.doctorProfile.findUnique({ where: { userId: user.id } });
        if (!doctor) {
          doctor = await this.prisma.doctorProfile.create({
            data: {
              userId: user.id,
              fullName: user.fullName || user.email,
              email: user.email,
              specialty: 'متخصص رادیولوژی و تله‌ریپورت',
              isActive: true,
              collaborationStatus: 'approved',
            },
          });
        }
      }
    }

    if (!doctor) {
      throw new NotFoundException('پزشک رادیولوژیست مورد نظر در دیتابیس یافت نشد');
    }

    // Ensure doctor is active and approved for receiving referrals
    if (!doctor.isActive || doctor.collaborationStatus !== 'approved') {
      await this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { isActive: true, collaborationStatus: 'approved' },
      });
    }

    const doctorUserId = doctor.userId;

    const existingReport = await this.prisma.radiologyReport.findFirst({
      where: { requestId: request.id },
    });

    const report = existingReport
      ? await this.prisma.radiologyReport.update({
          where: { id: existingReport.id },
          data: { authorId: doctorUserId, status: 'draft' },
          include: { author: { select: { id: true, fullName: true, email: true } } },
        })
      : await this.prisma.radiologyReport.create({
          data: { requestId: request.id, authorId: doctorUserId, status: 'draft', findings: '', conclusion: '' },
          include: { author: { select: { id: true, fullName: true, email: true } } },
        });

    await this.prisma.teleReportRequest.update({
      where: { id: request.id },
      data: {
        status: 'assigned',
        assignedDoctorId: doctor.id,
        referredAt: new Date(),
      },
    });

    return report;
  }

  @Patch(':id/review-report')
  async reviewReport(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: ReviewReportDto) {
    const identity = verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const request = await this.prisma.teleReportRequest.findFirst({
      where: isUuid(cleanId)
        ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
        : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
    });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');

    const report = await this.prisma.radiologyReport.findUnique({ where: { id: dto.reportId } });
    if (!report || (report.requestId !== request.id && report.requestId !== cleanId)) {
      throw new BadRequestException('گزارش رادیولوژی یافت نشد');
    }

    const updated = await this.prisma.radiologyReport.update({
      where: { id: dto.reportId },
      data: {
        status: dto.decision,
        signed: dto.decision === 'approved',
        signedAt: dto.decision === 'approved' ? (report.signedAt ?? new Date()) : null,
        rejectReason:
          dto.decision === 'rejected'
            ? (dto.rejectReason?.trim() || 'نیاز به بازبینی و اصلاح گزارش توسط پزشک رادیولوژیست')
            : null,
        reviewedBy: identity.id,
        reviewedAt: new Date(),
      },
      include: { author: { select: { id: true, fullName: true } } },
    });

    await this.prisma.teleReportRequest.update({
      where: { id: request.id },
      data: { status: dto.decision === 'approved' ? 'completed' : 'in_progress' },
    });

    return updated;
  }

  @Post(':id/notify')
  async notify(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: NotifyDto) {
    const identity = verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const request = await this.prisma.teleReportRequest.findFirst({
      where: isUuid(cleanId)
        ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
        : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
    });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    const notification = await this.prisma.telereportNotification.create({
      data: { requestId: request.id, recipient: dto.recipient, message: dto.message, sentBy: identity.id },
    });
    return { ok: true, notification };
  }

  @Patch(':id/coordinate')
  async coordinate(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: CoordinateDto) {
    verifySupportToken(auth);
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanId = String(id || '').trim();
    const request = await this.prisma.teleReportRequest.findFirst({
      where: isUuid(cleanId)
        ? { OR: [{ id: cleanId }, { requestNumber: cleanId }] }
        : { OR: [{ requestNumber: cleanId }, { requestNumber: { equals: cleanId, mode: 'insensitive' } }] },
    });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    return this.prisma.teleReportRequest.update({
      where: { id: request.id },
      data: {
        status: 'coordinating',
        ...(dto.notes !== undefined ? { clinicalHistory: `${request.clinicalHistory}\n[پشتیبانی] ${dto.notes}` } : {}),
        ...(dto.scheduledAt ? { studyDate: new Date(dto.scheduledAt) } : {}),
      },
    });
  }
}
