import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
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

@Controller('dashboard/report-archive')
export class ReportArchiveController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listArchive(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Headers('authorization') auth?: string,
  ) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
    const where: Prisma.RadiologyReportWhereInput = { authorId: user.id };

    if (status && status !== 'all') where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
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
          images: { select: { id: true, originalName: true, storedName: true, mimeType: true } },
          request: {
            select: {
              id: true,
              requestNumber: true,
              patientFirstName: true,
              patientLastName: true,
              imagingType: true,
              imagingArea: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const allCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id } });
    const draftCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, status: 'draft' } });
    const finalCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, status: 'final' } });
    const signedCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, signed: true } });

    return {
      items: reports,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      stats: {
        total: allCount,
        draft: draftCount,
        final: finalCount,
        signed: signedCount,
      },
    };
  }
}
