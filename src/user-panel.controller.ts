import {
  Body,
  Controller,
  Get,
  Headers,
  Put,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

type UserIdentity = { id: string; email: string; role: string; name?: string };

function verifyUserToken(auth?: string): UserIdentity {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    const userRole = (payload.role || '').toLowerCase();
    if (userRole !== 'user' && userRole !== 'patient') {
      throw new UnauthorizedException('دسترسی فقط برای بیماران و کاربران عادی مجاز است');
    }
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
    return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
}

class ChangePasswordDto {
  @IsString() @MinLength(6) currentPassword!: string;
  @IsString() @MinLength(6) newPassword!: string;
  @IsString() @MinLength(6) confirmNewPassword!: string;
}

@Controller('user')
export class UserPanelController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);

    const orderWhere = {
      OR: [{ userId: identity.id }, { customerEmail: identity.email }],
    };
    const teleWhere = {
      OR: [{ userId: identity.id }, { phone: identity.email }],
    };
    const consultWhere = { email: identity.email };

    const [orders, teleReports, consultations] = await Promise.all([
      this.prisma.shopOrder.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, items: { select: { productName: true, quantity: true } } },
      }),
      this.prisma.teleReportRequest.findMany({
        where: teleWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, requestNumber: true, imagingType: true, imagingArea: true, status: true, createdAt: true },
      }),
      this.prisma.consultationRequest.findMany({
        where: consultWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, message: true, status: true, createdAt: true },
      }),
    ]);

    const totalOrders = await this.prisma.shopOrder.count({ where: orderWhere });
    const totalTeleReports = await this.prisma.teleReportRequest.count({ where: teleWhere });
    const totalConsultations = await this.prisma.consultationRequest.count({ where: consultWhere });

    return {
      stats: { totalOrders, totalTeleReports, totalConsultations },
      latestOrders: orders,
      latestTeleReports: teleReports,
      latestConsultations: consultations,
    };
  }

  @Get('profile')
  async getProfile(@Headers('authorization') auth: string) {
    const identity = verifyUserToken(auth);
    const user = await this.prisma.user.findUnique({
      where: { id: identity.id },
      select: { id: true, fullName: true, email: true, role: true, country: true, status: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return { user };
  }

  @Put('profile')
  async updateProfile(@Headers('authorization') auth: string, @Body() dto: UpdateProfileDto) {
    const identity = verifyUserToken(auth);
    const user = await this.prisma.user.findUnique({ where: { id: identity.id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('این ایمیل قبلاً ثبت شده است');
    }

    const updated = await this.prisma.user.update({
      where: { id: identity.id },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.country ? { country: dto.country } : {}),
      },
      select: { id: true, fullName: true, email: true, role: true, country: true, status: true, createdAt: true },
    });

    return { ok: true, user: updated };
  }

  @Put('profile/change-password')
  async changePassword(@Headers('authorization') auth: string, @Body() dto: ChangePasswordDto) {
    const identity = verifyUserToken(auth);
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('رمز عبور جدید و تکرار آن یکسان نیستند');
    }

    const user = await this.prisma.user.findUnique({ where: { id: identity.id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('رمز عبور فعلی اشتباه است');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: identity.id }, data: { passwordHash } });

    return { ok: true, message: 'رمز عبور با موفقیت تغییر کرد' };
  }
}
