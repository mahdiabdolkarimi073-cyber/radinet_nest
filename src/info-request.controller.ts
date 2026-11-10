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
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
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

class CreateInfoRequestDto {
  @IsString() @Length(1, 36) requestId!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 5000) body!: string;
}

class UpdateInfoRequestDto {
  @IsOptional() @IsString() @Length(1, 5000) response?: string;
  @IsOptional() @IsIn(['open', 'answered', 'closed']) status?: string;
}

const statusLabels: Record<string, string> = {
  open: 'باز',
  answered: 'پاسخ داده شده',
  closed: 'بسته شده',
};

@Controller('dashboard/info-requests')
export class InfoRequestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listInfoRequests(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Headers('authorization') auth?: string,
  ) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
    const where: Prisma.InfoRequestWhereInput = { authorId: user.id };

    if (status && status !== 'all') where.status = status;
    if (search?.trim()) {
      const value = search.trim();
      where.OR = [
        { title: { contains: value, mode: 'insensitive' } },
        { body: { contains: value, mode: 'insensitive' } },
        { request: { requestNumber: { contains: value, mode: 'insensitive' } } },
        { request: { patientFirstName: { contains: value, mode: 'insensitive' } } },
        { request: { patientLastName: { contains: value, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.infoRequest.count({ where }),
      this.prisma.infoRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
      items,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      statusLabels,
    };
  }

  @Post()
  async createInfoRequest(
    @Body() body: CreateInfoRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id: body.requestId },
      select: { id: true },
    });
    if (!request) throw new BadRequestException('درخواست بیمار پیدا نشد');

    return this.prisma.infoRequest.create({
      data: {
        requestId: body.requestId,
        authorId: user.id,
        title: body.title,
        body: body.body,
        status: 'open',
      },
      include: {
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
  }

  @Patch(':id')
  async updateInfoRequest(
    @Param('id') id: string,
    @Body() body: UpdateInfoRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    const user = extractUser(auth);
    if (!user) throw new UnauthorizedException('احراز هویت الزامی است');
    if (user.role !== 'radiologist') throw new ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');

    const existing = await this.prisma.infoRequest.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('درخواست اطلاعات پیدا نشد');
    if (existing.authorId !== user.id) throw new UnauthorizedException('دسترسی مجاز نیست');

    const data: Prisma.InfoRequestUpdateInput = {};
    if (body.response !== undefined) {
      data.response = body.response;
      data.respondedAt = new Date();
      if (existing.status === 'open') data.status = 'answered';
    }
    if (body.status !== undefined) data.status = body.status;

    return this.prisma.infoRequest.update({
      where: { id },
      data,
      include: {
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
  }
}
