import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { Prisma } from '@prisma/client';
import {
  MultipartUploadInterceptor,
  UploadedMultipartFiles,
  type StoredUploadFile,
} from './multipart-upload';
import { PrismaService } from './prisma.service';
import { verifyAuthToken } from './auth-token';
import {
  cleanupUploadedFiles,
  parseOptionalValidDate,
  parseValidatedAge,
} from './tele-report-validation';

// ── DTOs ──

class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  @MaxLength(120)
  fullName!: string;

  @IsEmail({}, { message: 'فرمت ایمیل معتبر نیست' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @IsIn(['ORG_STAFF', 'ORG_ADMIN', 'org_staff', 'org_admin'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}

class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'نام نمی‌تواند خالی باشد' })
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل معتبر نیست' })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ORG_STAFF', 'ORG_ADMIN', 'org_staff', 'org_admin'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}

class CreateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  patientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  patientFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  patientLastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @Allow()
  age?: number | string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @IsString()
  @IsNotEmpty({ message: 'نوع خدمت / تصویربرداری الزامی است' })
  @MaxLength(80)
  requestType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  imagingArea?: string;

  @IsOptional()
  @Allow()
  studyDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptoms?: string;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'urgent', 'emergency'])
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pacsUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cloudUrl?: string;

  @IsOptional()
  @IsString()
  submittingUserId?: string;
}

class UpdateRequestStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['new', 'pending', 'in_progress', 'processing', 'completed', 'rejected', 'cancelled'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'نام سازمان نمی‌تواند خالی باشد' })
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  economicCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;
}

class UpdateOrgPermissionsDto {
  @IsOptional()
  @IsBoolean()
  staffCanSubmit?: boolean;

  @IsOptional()
  @IsBoolean()
  staffCanViewReports?: boolean;

  @IsOptional()
  @IsBoolean()
  staffCanViewAllRequests?: boolean;
}

class RecordInvoicePaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['bank_transfer', 'online_gateway', 'cheque', 'credit'])
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

class RequestQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

class ReportQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

@Controller('org')
export class OrgController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Auth Helpers ──

  private async requireOrgUser(authHeader?: string) {
    const payload = verifyAuthToken(authHeader);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ForbiddenException('کاربر یافت نشد');
    const normalizedRole = user.role.toLowerCase();
    if (normalizedRole !== 'org_admin' && normalizedRole !== 'org_staff') {
      throw new ForbiddenException('دسترسی فقط برای اعضای سازمان مجاز است');
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('حساب کاربری غیرفعال است');
    }
    if (!user.organizationId) {
      let org = await this.prisma.organization.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!org) {
        const slug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        org = await this.prisma.organization.create({
          data: {
            name: `سازمان ${user.fullName}`,
            slug,
            type: 'company',
            email: user.email,
            isActive: true,
          },
        });
      }
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { organizationId: org.id },
      });
      return updatedUser;
    }
    return user;
  }

  private async requireOrgAdmin(authHeader?: string) {
    const user = await this.requireOrgUser(authHeader);
    if (user.role.toLowerCase() !== 'org_admin') {
      throw new ForbiddenException('دسترسی فقط برای مدیر سازمان مجاز است');
    }
    return user;
  }

  private async getOrgPermissions(orgId: string): Promise<{
    staffCanSubmit: boolean;
    staffCanViewReports: boolean;
    staffCanViewAllRequests: boolean;
  }> {
    let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
    if (!settings) {
      settings = await this.prisma.orgSettings.create({
        data: {
          orgId,
          settings: {
            staffCanSubmit: true,
            staffCanViewReports: true,
            staffCanViewAllRequests: true,
          },
        },
      });
    }
    const raw = (settings.settings ?? {}) as Record<string, boolean>;
    return {
      staffCanSubmit: raw.staffCanSubmit !== false,
      staffCanViewReports: raw.staffCanViewReports !== false,
      staffCanViewAllRequests: raw.staffCanViewAllRequests !== false,
    };
  }

  // ── 0. Context / Profile ──

  @Get('context')
  async getContext(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;
    const [org, permissions] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          province: true,
          logo: true,
          isActive: true,
        },
      }),
      this.getOrgPermissions(orgId),
    ]);
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.toUpperCase(),
        organizationId: orgId,
      },
      organization: org,
      permissions,
    };
  }

  // ── 1. Dashboard ──

  @Get('dashboard/stats')
  async dashboardStats(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const pendingStatuses = ['new', 'pending', 'in_progress', 'processing', 'reviewing', 'need_info'];
    const completedStatuses = ['completed', 'signed', 'approved', 'delivered', 'referred'];
    const rejectedStatuses = ['rejected', 'cancelled'];

    const [
      organization,
      totalRequests,
      pendingRequests,
      completedRequests,
      rejectedRequests,
      staffCount,
      activeStaffCount,
      recentRequests,
      requestsByType,
      allInvoices,
      recentPayments,
      recentStatusLogs,
      recentUsers,
    ] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          province: true,
          phone: true,
          email: true,
        },
      }),
      this.prisma.teleReportRequest.count({
        where: { user: { organizationId: orgId } },
      }),
      this.prisma.teleReportRequest.count({
        where: {
          user: { organizationId: orgId },
          status: { in: pendingStatuses },
        },
      }),
      this.prisma.teleReportRequest.count({
        where: {
          user: { organizationId: orgId },
          status: { in: completedStatuses },
        },
      }),
      this.prisma.teleReportRequest.count({
        where: {
          user: { organizationId: orgId },
          status: { in: rejectedStatuses },
        },
      }),
      this.prisma.user.count({
        where: { organizationId: orgId },
      }),
      this.prisma.user.count({
        where: { organizationId: orgId, status: 'active' },
      }),
      this.prisma.teleReportRequest.findMany({
        where: { user: { organizationId: orgId } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          phone: true,
          imagingType: true,
          imagingArea: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.teleReportRequest.groupBy({
        by: ['imagingType'],
        where: { user: { organizationId: orgId } },
        _count: { id: true },
      }),
      this.prisma.orgInvoice.findMany({
        where: {
          OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
        },
        include: {
          payments: true,
          contract: { select: { id: true, contractNumber: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orgPayment.findMany({
        where: {
          invoice: {
            OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
          },
        },
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
      this.prisma.orgRequestStatusLog.findMany({
        where: {
          user: { organizationId: orgId },
        },
        include: {
          user: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.user.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, fullName: true, role: true, createdAt: true },
      }),
    ]);

    // Calculate financial totals from real DB records
    let totalInvoicedAmount = 0;
    let totalPaidAmount = 0;
    let remainingDebtAmount = 0;
    let pendingInvoices = 0;
    let paidInvoicesCount = 0;
    let overdueInvoicesCount = 0;

    const formattedInvoices = allInvoices.map((inv) => {
      const invAmount = Number(inv.amount ?? 0);
      const paymentsSum = inv.payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
      const effectivePaid =
        inv.status === 'paid' && paymentsSum === 0 ? invAmount : Math.min(invAmount, paymentsSum);
      const remaining = inv.status === 'paid' ? 0 : Math.max(0, invAmount - effectivePaid);

      totalInvoicedAmount += invAmount;
      totalPaidAmount += effectivePaid;
      remainingDebtAmount += remaining;

      if (inv.status === 'paid') {
        paidInvoicesCount += 1;
      } else {
        pendingInvoices += 1;
        if (inv.status === 'overdue') overdueInvoicesCount += 1;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: String(invAmount),
        paidAmount: String(effectivePaid),
        remainingAmount: String(remaining),
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: inv.createdAt,
        contract: inv.contract,
      };
    });

    // Monthly request counts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentAll = await this.prisma.teleReportRequest.findMany({
      where: {
        user: { organizationId: orgId },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
    });

    const monthlyMap: Record<string, number> = {};
    for (const r of recentAll) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    }
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Build combined recent organization activities
    const activities: Array<{
      id: string;
      type: 'request_log' | 'payment' | 'user';
      title: string;
      description: string;
      actor: string;
      createdAt: Date;
    }> = [];

    for (const log of recentStatusLogs) {
      activities.push({
        id: `log-${log.id}`,
        type: 'request_log',
        title: log.status === 'new' ? 'ثبت درخواست تله‌ریپورت' : `تغییر وضعیت درخواست (${log.status})`,
        description: log.note || 'به‌روزرسانی وضعیت درخواست در سامانه',
        actor: log.user?.fullName ?? 'کاربر سازمان',
        createdAt: log.createdAt,
      });
    }

    for (const pay of recentPayments) {
      activities.push({
        id: `pay-${pay.id}`,
        type: 'payment',
        title: `ثبت پرداخت صورت‌حساب ${pay.invoice.invoiceNumber}`,
        description: `مبلغ ${Number(pay.amount).toLocaleString('fa-IR')} ریال (${pay.reference || pay.method})`,
        actor: 'امور مالی سازمان',
        createdAt: pay.paidAt,
      });
    }

    for (const u of recentUsers) {
      activities.push({
        id: `usr-${u.id}`,
        type: 'user',
        title: 'عضویت کاربر در سازمان',
        description: `${u.fullName} (${u.role.toLowerCase() === 'org_admin' ? 'مدیر سازمان' : 'کارشناس سازمان'})`,
        actor: u.fullName,
        createdAt: u.createdAt,
      });
    }

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      organization,
      totalRequests,
      pendingRequests,
      completedRequests,
      rejectedRequests,
      staffCount,
      activeStaffCount,
      pendingInvoices,
      totalInvoicesCount: allInvoices.length,
      paidInvoicesCount,
      overdueInvoicesCount,
      totalInvoicedAmount: String(totalInvoicedAmount),
      totalPaidAmount: String(totalPaidAmount),
      remainingDebtAmount: String(remainingDebtAmount),
      recentInvoices: formattedInvoices.slice(0, 5),
      recentRequests,
      recentActivities: activities.slice(0, 8),
      requestsByType: requestsByType.map((g) => ({
        name: g.imagingType || 'سایر',
        count: g._count.id,
      })),
      monthlyData,
    };
  }

  // ── 2. Organization Users Management ──

  @Get('users')
  async listUsers(
    @Headers('authorization') auth?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    // Allow ORG_ADMIN full management, and ORG_STAFF read-only list for selecting users in forms
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const where: Prisma.UserWhereInput = {
      organizationId: orgId,
    };

    if (status && (status === 'active' || status === 'inactive')) {
      where.status = status;
    }
    if (role) {
      const normalized = role.toLowerCase();
      if (normalized === 'org_admin') {
        where.role = { in: ['ORG_ADMIN', 'org_admin'] };
      } else if (normalized === 'org_staff') {
        where.role = { in: ['ORG_STAFF', 'org_staff'] };
      }
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            teleReportRequests: true,
          },
        },
      },
    });

    return users.map((u) => ({
      ...u,
      role: u.role.toUpperCase(),
      requestsCount: u._count.teleReportRequests,
    }));
  }

  @Post('users')
  async createUser(@Headers('authorization') auth: string, @Body() dto: CreateStaffDto) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('این ایمیل قبلاً در سامانه ثبت شده است');
    }

    const requestedRole = (dto.role ?? 'ORG_STAFF').toUpperCase();
    const allowedRole = requestedRole === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'ORG_STAFF';
    const allowedStatus = dto.status === 'inactive' ? 'inactive' : 'active';

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        passwordHash,
        role: allowedRole,
        status: allowedStatus,
        organizationId: orgId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      ...created,
      role: created.role.toUpperCase(),
      requestsCount: 0,
    };
  }

  @Put('users/:id')
  async updateUser(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.organizationId !== orgId) {
      throw new NotFoundException('کاربر در سازمان شما یافت نشد');
    }

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (dto.fullName !== undefined) {
      if (!dto.fullName.trim()) throw new BadRequestException('نام کاربر نمی‌تواند خالی باشد');
      data.fullName = dto.fullName.trim();
    }
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== target.email) {
        const dup = await this.prisma.user.findUnique({ where: { email } });
        if (dup) throw new BadRequestException('این ایمیل قبلاً ثبت شده است');
        data.email = email;
      }
    }
    if (dto.status !== undefined) {
      if (id === admin.id && dto.status === 'inactive') {
        throw new BadRequestException('نمی‌توانید حساب کاربری خودتان را غیرفعال کنید');
      }
      data.status = dto.status;
    }
    if (dto.role !== undefined) {
      const normalized = dto.role.toUpperCase();
      if (id === admin.id && normalized !== 'ORG_ADMIN') {
        throw new BadRequestException('نمی‌توانید نقش مدیریت سازمان را از حساب خودتان سلب کنید');
      }
      data.role = normalized === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'ORG_STAFF';
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { teleReportRequests: true } },
      },
    });

    return {
      ...updated,
      role: updated.role.toUpperCase(),
      requestsCount: updated._count.teleReportRequests,
    };
  }

  @Delete('users/:id')
  async deleteUser(@Headers('authorization') auth: string, @Param('id') id: string) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.organizationId !== orgId) {
      throw new NotFoundException('کاربر در سازمان شما یافت نشد');
    }
    if (id === admin.id) {
      throw new BadRequestException('نمی‌توانید حساب کاربری خودتان را حذف کنید');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teleReportRequest.updateMany({
        where: { userId: id },
        data: { userId: admin.id },
      });
      await tx.orgRequestStatusLog.updateMany({
        where: { createdBy: id },
        data: { createdBy: admin.id },
      });
      await tx.radiologyReport.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      });
      await tx.infoRequest.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      });
      await tx.shopOrder.updateMany({
        where: { userId: id },
        data: { userId: null },
      });
      await tx.telereportNotification.updateMany({
        where: { sentBy: id },
        data: { sentBy: null },
      });
      await tx.user.delete({ where: { id } });
    });

    return { ok: true };
  }

  // ── 3 & 4. Tele-Report Requests (Create, List, Detail, Status Update) ──

  @Get('requests')
  async listRequests(@Headers('authorization') auth: string, @Query() query: RequestQueryDto) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;
    const perms = await this.getOrgPermissions(orgId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const skip = (page - 1) * limit;

    const where: Prisma.TeleReportRequestWhereInput = {
      user: { organizationId: orgId },
    };

    // If ORG_STAFF and staffCanViewAllRequests is false, scope to their own requests
    if (user.role.toLowerCase() === 'org_staff' && !perms.staffCanViewAllRequests) {
      where.userId = user.id;
    } else if (query.userId) {
      // Verify that the filtered userId belongs to the same organization
      const targetUser = await this.prisma.user.findUnique({ where: { id: query.userId } });
      if (targetUser && targetUser.organizationId === orgId) {
        where.userId = query.userId;
      } else {
        where.userId = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (query.status) {
      if (query.status === 'pending_group') {
        where.status = { in: ['new', 'pending', 'in_progress', 'processing', 'reviewing'] };
      } else {
        where.status = query.status;
      }
    }
    if (query.type) {
      where.imagingType = query.type;
    }
    if (query.startDate || query.endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.startDate) createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { requestNumber: { contains: q, mode: 'insensitive' } },
        { patientFirstName: { contains: q, mode: 'insensitive' } },
        { patientLastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { nationalId: { contains: q, mode: 'insensitive' } },
        { imagingType: { contains: q, mode: 'insensitive' } },
        { imagingArea: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.teleReportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          nationalId: true,
          phone: true,
          city: true,
          age: true,
          gender: true,
          imagingType: true,
          imagingArea: true,
          clinicalHistory: true,
          symptoms: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, fullName: true, email: true, role: true } },
          _count: { select: { attachments: true, reports: true } },
        },
      }),
      this.prisma.teleReportRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  @Post('requests')
  @UseInterceptors(
    new MultipartUploadInterceptor({
      fieldName: 'attachments',
      destination: join(process.cwd(), 'uploads', 'tele-reports'),
      maxFiles: 5,
      maxFileSize: 20 * 1024 * 1024,
    }),
  )
  async createRequest(
    @Headers('authorization') auth: string,
    @Body() dto: CreateRequestDto,
    @UploadedMultipartFiles() files: StoredUploadFile[] = [],
  ) {
    try {
      const user = await this.requireOrgUser(auth);
      const orgId = user.organizationId!;

      if (user.role.toLowerCase() === 'org_staff') {
        const perms = await this.getOrgPermissions(orgId);
        if (!perms.staffCanSubmit) {
          throw new ForbiddenException('دسترسی ثبت درخواست برای کارشناسان سازمان غیرفعال است');
        }
      }

      // Determine which organization user this request is associated with
      let targetUserId = user.id;
      if (dto.submittingUserId && dto.submittingUserId !== user.id) {
        const subUser = await this.prisma.user.findUnique({
          where: { id: dto.submittingUserId },
        });
        if (!subUser || subUser.organizationId !== orgId) {
          throw new BadRequestException('کاربر انتخاب‌شده متعلق به این سازمان نیست');
        }
        targetUserId = subUser.id;
      }

      // Parse patient first/last name
      let firstName = (dto.patientFirstName ?? '').trim();
      let lastName = (dto.patientLastName ?? '').trim();
      if (!firstName && dto.patientName) {
        const nameParts = dto.patientName.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      if (!firstName) {
        throw new BadRequestException('نام بیمار الزامی است');
      }

      const validatedAge = parseValidatedAge(dto.age, { required: false });
      const validatedStudyDate = parseOptionalValidDate(dto.studyDate, 'تاریخ تصویربرداری');

      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { city: true, phone: true },
      });

      const priorityLabel =
        dto.priority === 'emergency'
          ? 'اورژانسی'
          : dto.priority === 'urgent'
            ? 'فوری'
            : 'عادی';

      const requestNumber = `ORG-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;

      const clinicalHistoryText = [
        dto.priority && dto.priority !== 'normal' ? `[اولویت: ${priorityLabel}]` : '',
        (dto.description ?? '').trim(),
      ]
        .filter(Boolean)
        .join(' — ');

      // Save uploaded attachments metadata if any (files already written to disk by MultipartUploadInterceptor)
      const attachmentRecords: Array<{
        originalName: string;
        storedName: string;
        mimeType: string;
        size: number;
        storagePath: string;
      }> = files.map((file) => ({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size,
        storagePath: `/uploads/tele-reports/${file.filename}`,
      }));

      const request = await this.prisma.teleReportRequest.create({
        data: {
          requestNumber,
          userId: targetUserId,
          country: 'IR',
          language: 'fa',
          patientFirstName: firstName,
          patientLastName: lastName,
          nationalId: dto.nationalId?.trim() || null,
          phone: dto.phone?.trim() || org?.phone || '',
          city: dto.city?.trim() || org?.city || 'تهران',
          age: validatedAge,
          gender: dto.gender?.trim() || 'unknown',
          clinicalHistory: clinicalHistoryText,
          symptoms: (dto.symptoms ?? '').trim(),
          imagingType: dto.requestType.trim(),
          imagingArea: (dto.imagingArea ?? '').trim() || 'عمومی',
          studyDate: validatedStudyDate,
          pacsUrl: dto.pacsUrl?.trim() || null,
          cloudUrl: dto.cloudUrl?.trim() || null,
          status: 'new',
          attachments:
            attachmentRecords.length > 0
              ? {
                  create: attachmentRecords,
                }
              : undefined,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          attachments: true,
        },
      });

      await this.prisma.orgRequestStatusLog.create({
        data: {
          requestId: request.id,
          status: 'new',
          note:
            targetUserId !== user.id
              ? `درخواست توسط ${user.fullName} برای کاربر زیرمجموعه (${request.user?.fullName ?? ''}) ثبت شد — اولویت: ${priorityLabel}`
              : `درخواست تله‌ریپورت ثبت شد — اولویت: ${priorityLabel}`,
          createdBy: user.id,
        },
      });

      return request;
    } catch (error) {
      await cleanupUploadedFiles(files);
      throw error;
    }
  }

  @Get('requests/:id')
  async getRequest(@Headers('authorization') auth: string, @Param('id') id: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true, organizationId: true } },
        attachments: true,
        reports: {
          include: {
            author: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        infoRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request || request.user?.organizationId !== orgId) {
      throw new NotFoundException('درخواست در سازمان شما یافت نشد');
    }

    const statusLogs = await this.prisma.orgRequestStatusLog.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { fullName: true, role: true } },
      },
    });

    return { ...request, statusLogs };
  }

  @Post('requests/:id/status')
  async updateRequestStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: { user: { select: { organizationId: true } } },
    });

    if (!request || request.user?.organizationId !== orgId) {
      throw new NotFoundException('درخواست در سازمان شما یافت نشد');
    }

    const updated = await this.prisma.teleReportRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    const log = await this.prisma.orgRequestStatusLog.create({
      data: {
        requestId: id,
        status: dto.status,
        note: (dto.note ?? '').trim() || `وضعیت درخواست به «${dto.status}» تغییر یافت`,
        createdBy: user.id,
      },
      include: {
        user: { select: { fullName: true, role: true } },
      },
    });

    return { request: updated, log };
  }

  // ── 5. Reports ──

  @Get('reports')
  async getReports(@Headers('authorization') auth: string, @Query() query: ReportQueryDto) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    if (user.role.toLowerCase() === 'org_staff') {
      const perms = await this.getOrgPermissions(orgId);
      if (!perms.staffCanViewReports) {
        throw new ForbiddenException('دسترسی مشاهده گزارش‌ها برای کارشناسان سازمان غیرفعال است');
      }
    }

    const where: Prisma.TeleReportRequestWhereInput = {
      user: { organizationId: orgId },
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.imagingType = query.type;
    }
    if (query.userId) {
      const targetUser = await this.prisma.user.findUnique({ where: { id: query.userId } });
      if (targetUser && targetUser.organizationId === orgId) {
        where.userId = query.userId;
      } else {
        where.userId = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (query.startDate || query.endDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.startDate) createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const [requests, orgUsers] = await Promise.all([
      this.prisma.teleReportRequest.findMany({
        where,
        select: {
          id: true,
          imagingType: true,
          imagingArea: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const completedSet = new Set(['completed', 'signed', 'approved', 'delivered', 'referred']);
    const rejectedSet = new Set(['rejected', 'cancelled']);

    // Summary stats
    let completedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    // By User (with performance breakdown)
    const userMap: Record<
      string,
      {
        userId: string;
        name: string;
        role: string;
        count: number;
        completed: number;
        pending: number;
        rejected: number;
      }
    > = {};

    for (const u of orgUsers) {
      userMap[u.id] = {
        userId: u.id,
        name: u.fullName,
        role: u.role.toUpperCase(),
        count: 0,
        completed: 0,
        pending: 0,
        rejected: 0,
      };
    }

    const typeMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};

    for (const r of requests) {
      const isCompleted = completedSet.has(r.status);
      const isRejected = rejectedSet.has(r.status);

      if (isCompleted) completedCount += 1;
      else if (isRejected) rejectedCount += 1;
      else pendingCount += 1;

      const uKey = r.user?.id || 'unknown';
      if (!userMap[uKey]) {
        userMap[uKey] = {
          userId: uKey,
          name: r.user?.fullName || 'نامشخص',
          role: r.user?.role?.toUpperCase() || 'ORG_STAFF',
          count: 0,
          completed: 0,
          pending: 0,
          rejected: 0,
        };
      }
      userMap[uKey].count += 1;
      if (isCompleted) userMap[uKey].completed += 1;
      else if (isRejected) userMap[uKey].rejected += 1;
      else userMap[uKey].pending += 1;

      const tName = r.imagingType || 'سایر';
      typeMap[tName] = (typeMap[tName] || 0) + 1;

      const sName = r.status || 'new';
      statusMap[sName] = (statusMap[sName] || 0) + 1;

      const dKey = r.createdAt.toISOString().slice(0, 10);
      dateMap[dKey] = (dateMap[dKey] || 0) + 1;
    }

    const totalCount = requests.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      summary: {
        total: totalCount,
        completed: completedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        completionRate,
      },
      byUser: Object.values(userMap).sort((a, b) => b.count - a.count),
      byType: Object.entries(typeMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      byStatus: Object.entries(statusMap)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      byDate: Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    };
  }

  // ── 6. Contracts, Invoices & Payments ──

  @Get('contracts')
  async listContracts(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const contracts = await this.prisma.organizationContract.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        center: { select: { id: true, name: true, city: true, phone: true } },
        invoices: {
          include: { payments: true },
        },
        _count: { select: { invoices: true } },
      },
    });

    return contracts.map((c) => {
      const totalInvoiced = c.invoices.reduce((s, inv) => s + Number(inv.amount ?? 0), 0);
      const totalPaid = c.invoices.reduce((s, inv) => {
        const invAmt = Number(inv.amount ?? 0);
        const pSum = inv.payments.reduce((ps, p) => ps + Number(p.amount ?? 0), 0);
        return s + (inv.status === 'paid' && pSum === 0 ? invAmt : Math.min(invAmt, pSum));
      }, 0);

      return {
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        type: c.type,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        terms: c.terms,
        discountPercent: c.discountPercent,
        creditLimit: c.creditLimit ? String(c.creditLimit) : null,
        signedBy: c.signedBy,
        signedAt: c.signedAt,
        notes: c.notes,
        center: c.center,
        _count: c._count,
        totalInvoiced: String(totalInvoiced),
        totalPaid: String(totalPaid),
        createdAt: c.createdAt,
      };
    });
  }

  @Get('contracts/invoices')
  async listInvoices(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const invoices = await this.prisma.orgInvoice.findMany({
      where: {
        OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contract: { select: { id: true, contractNumber: true, title: true } },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        _count: { select: { payments: true } },
      },
    });

    return invoices.map((inv) => {
      const invAmount = Number(inv.amount ?? 0);
      const paidSum = inv.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const effectivePaid =
        inv.status === 'paid' && paidSum === 0 ? invAmount : Math.min(invAmount, paidSum);
      const remaining = inv.status === 'paid' ? 0 : Math.max(0, invAmount - effectivePaid);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: String(invAmount),
        paidAmount: String(effectivePaid),
        remainingAmount: String(remaining),
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: inv.createdAt,
        contract: inv.contract,
        payments: inv.payments.map((p) => ({
          id: p.id,
          amount: String(p.amount),
          paidAt: p.paidAt,
          method: p.method,
          reference: p.reference,
        })),
        _count: inv._count,
      };
    });
  }

  @Get('contracts/payments')
  async listPayments(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const payments = await this.prisma.orgPayment.findMany({
      where: {
        invoice: {
          OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
        },
      },
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            contract: { select: { id: true, contractNumber: true, title: true } },
          },
        },
      },
    });

    return payments.map((p) => ({
      ...p,
      amount: String(p.amount),
    }));
  }

  @Post('contracts/invoices/:id/pay')
  async payInvoice(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: RecordInvoicePaymentDto,
  ) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    const invoice = await this.prisma.orgInvoice.findUnique({
      where: { id },
      include: {
        contract: { select: { organizationId: true } },
        payments: true,
      },
    });

    if (
      !invoice ||
      (invoice.organizationId !== orgId && invoice.contract?.organizationId !== orgId)
    ) {
      throw new NotFoundException('صورت‌حساب در سازمان شما یافت نشد');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('این صورت‌حساب قبلاً به‌طور کامل پرداخت شده است');
    }

    const totalInvoiceAmount = Number(invoice.amount ?? 0);
    const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const remaining = Math.max(0, totalInvoiceAmount - alreadyPaid);

    const paymentAmount =
      dto.amount !== undefined && dto.amount > 0 ? Math.min(dto.amount, remaining) : remaining;

    if (paymentAmount <= 0) {
      throw new BadRequestException('مبلغ قابل پرداخت معتبر نیست');
    }

    const method = dto.method || 'online_gateway';
    const reference =
      dto.reference?.trim() ||
      `PAY-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;

    const newPaidTotal = alreadyPaid + paymentAmount;
    const isFullyPaid = newPaidTotal >= totalInvoiceAmount;

    const [payment, updatedInvoice] = await this.prisma.$transaction([
      this.prisma.orgPayment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paidAt: new Date(),
          method,
          reference,
        },
      }),
      this.prisma.orgInvoice.update({
        where: { id: invoice.id },
        data: {
          status: isFullyPaid ? 'paid' : invoice.status,
        },
      }),
    ]);

    return {
      payment: {
        ...payment,
        amount: String(payment.amount),
      },
      invoice: {
        ...updatedInvoice,
        amount: String(updatedInvoice.amount),
      },
    };
  }

  // ── 7. Settings ──

  @Get('settings')
  async getSettings(@Headers('authorization') auth?: string) {
    const user = await this.requireOrgUser(auth);
    const orgId = user.organizationId!;

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        nationalId: true,
        economicCode: true,
        registrationNumber: true,
        email: true,
        phone: true,
        province: true,
        city: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        contactEmail: true,
        description: true,
        logo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!org) throw new NotFoundException('سازمان یافت نشد');

    let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
    if (!settings) {
      settings = await this.prisma.orgSettings.create({
        data: {
          orgId,
          settings: {
            staffCanSubmit: true,
            staffCanViewReports: true,
            staffCanViewAllRequests: true,
          },
        },
      });
    }

    return { org, settings };
  }

  @Put('settings')
  async updateSettings(@Headers('authorization') auth: string, @Body() dto: UpdateOrgDto) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    const data: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) {
      if (!dto.name.trim()) throw new BadRequestException('نام سازمان نمی‌تواند خالی باشد');
      data.name = dto.name.trim();
    }
    if (dto.type !== undefined) data.type = dto.type.trim() || 'company';
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId.trim() || null;
    if (dto.economicCode !== undefined) data.economicCode = dto.economicCode.trim() || null;
    if (dto.registrationNumber !== undefined)
      data.registrationNumber = dto.registrationNumber.trim() || null;
    if (dto.email !== undefined) data.email = dto.email.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.province !== undefined) data.province = dto.province.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.contactPerson !== undefined) data.contactPerson = dto.contactPerson.trim() || null;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone.trim() || null;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail.trim() || null;
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.logo !== undefined) data.logo = dto.logo.trim() || null;

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data,
    });

    return updated;
  }

  @Put('settings/permissions')
  async updatePermissions(
    @Headers('authorization') auth: string,
    @Body() dto: UpdateOrgPermissionsDto,
  ) {
    const admin = await this.requireOrgAdmin(auth);
    const orgId = admin.organizationId!;

    let existing = await this.prisma.orgSettings.findUnique({ where: { orgId } });
    const currentSettings = (existing?.settings as Record<string, boolean>) ?? {
      staffCanSubmit: true,
      staffCanViewReports: true,
      staffCanViewAllRequests: true,
    };

    const newSettings = {
      ...currentSettings,
      ...(dto.staffCanSubmit !== undefined ? { staffCanSubmit: dto.staffCanSubmit } : {}),
      ...(dto.staffCanViewReports !== undefined
        ? { staffCanViewReports: dto.staffCanViewReports }
        : {}),
      ...(dto.staffCanViewAllRequests !== undefined
        ? { staffCanViewAllRequests: dto.staffCanViewAllRequests }
        : {}),
    };

    if (existing) {
      existing = await this.prisma.orgSettings.update({
        where: { orgId },
        data: { settings: newSettings },
      });
    } else {
      existing = await this.prisma.orgSettings.create({
        data: { orgId, settings: newSettings },
      });
    }

    return existing;
  }
}
