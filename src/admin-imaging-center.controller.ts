import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
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

class CreateImagingCenterDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class UpdateImagingCenterDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class CenterQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('admin/imaging-centers')
export class AdminImagingCenterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listCenters(@Headers('authorization') auth: string, @Query() query: CenterQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);

    const where: Prisma.ImagingCenterWhereInput = {};
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'inactive') where.isActive = false;
    if (query.city && query.city !== 'all') where.city = query.city;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { name: { contains: value, mode: 'insensitive' } },
        { slug: { contains: value, mode: 'insensitive' } },
        { city: { contains: value, mode: 'insensitive' } },
        { licenseNumber: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, centers] = await Promise.all([
      this.prisma.imagingCenter.count({ where }),
      this.prisma.imagingCenter.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { users: true, contracts: true } },
        },
      }),
    ]);

    const centersWithStats = await Promise.all(
      centers.map(async (center) => {
        const [orders, requests] = await Promise.all([
          this.prisma.shopOrder.count({
            where: { customerPhone: center.phone },
          }),
          this.prisma.teleReportRequest.count({
            where: { phone: center.phone },
          }),
        ]);
        return {
          ...center,
          stats: { orders, requests },
        };
      }),
    );

    return {
      items: centersWithStats,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getCenter(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const center = await this.prisma.imagingCenter.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        contracts: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { users: true, contracts: true } },
      },
    });

    if (!center) throw new NotFoundException('مرکز تصویربرداری یافت نشد');

    const recentOrders = await this.prisma.shopOrder.findMany({
      where: { customerPhone: center.phone },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    const recentRequests = await this.prisma.teleReportRequest.findMany({
      where: { phone: center.phone },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        requestNumber: true,
        patientFirstName: true,
        patientLastName: true,
        imagingType: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      center,
      activity: {
        orders: recentOrders,
        requests: recentRequests,
      },
    };
  }

  @Post()
  async createCenter(@Headers('authorization') auth: string, @Body() dto: CreateImagingCenterDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.imagingCenter.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('این شناسه (slug) قبلاً ثبت شده است');

    return this.prisma.imagingCenter.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? '',
        address: dto.address ?? '',
        phone: dto.phone ?? '',
        email: dto.email ?? '',
        city: dto.city ?? '',
        province: dto.province ?? '',
        latitude: dto.latitude,
        longitude: dto.longitude,
        logoUrl: dto.logoUrl,
        licenseNumber: dto.licenseNumber,
        contactPerson: dto.contactPerson,
        contactPhone: dto.contactPhone,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  @Patch(':id')
  async updateCenter(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateImagingCenterDto) {
    verifyAdmin(auth);

    const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('مرکز تصویربرداری یافت نشد');

    if (dto.slug && dto.slug !== center.slug) {
      const existing = await this.prisma.imagingCenter.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
    }

    return this.prisma.imagingCenter.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  async deleteCenter(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('مرکز تصویربرداری یافت نشد');

    await this.prisma.imagingCenter.delete({ where: { id } });
    return { ok: true };
  }

  @Get(':id/users')
  async listCenterUsers(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('مرکز تصویربرداری یافت نشد');

    return this.prisma.user.findMany({
      where: { imagingCenterId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Patch(':id/users/:userId')
  async assignUserToCenter(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    verifyAdmin(auth);

    const center = await this.prisma.imagingCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('مرکز تصویربرداری یافت نشد');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    return this.prisma.user.update({
      where: { id: userId },
      data: { imagingCenterId: id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        imagingCenterId: true,
      },
    });
  }

  @Delete(':id/users/:userId')
  async removeUserFromCenter(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    verifyAdmin(auth);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    if (user.imagingCenterId !== id) throw new BadRequestException('این کاربر به این مرکز متصل نیست');

    return this.prisma.user.update({
      where: { id: userId },
      data: { imagingCenterId: null },
      select: { id: true, fullName: true, imagingCenterId: true },
    });
  }
}
