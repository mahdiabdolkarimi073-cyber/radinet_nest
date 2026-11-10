import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class OrderQueryDto { @IsOptional() @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']) status?: string; @IsOptional() @IsString() search?: string; }
class TrackingDto { @IsString() @MinLength(1) trackingCode!: string; @IsOptional() @IsString() shippingCompany?: string; @IsOptional() @IsBoolean() notifyCustomer?: boolean; }
class OrderStatusDto { @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']) status!: string; @IsOptional() @IsBoolean() notifyCustomer?: boolean; }

@Controller('support/orders')
@UseGuards(SupportExpertGuard)
export class SupportOrderController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Headers('authorization') auth: string, @Query() query: OrderQueryDto) {
    verifySupportToken(auth);
    return this.prisma.shopOrder.findMany({ where: { ...(query.status && query.status !== 'all' ? { status: query.status } : {}), ...(query.search?.trim() ? { OR: [{ orderNumber: { contains: query.search.trim(), mode: 'insensitive' } }, { customerName: { contains: query.search.trim(), mode: 'insensitive' } }, { customerPhone: { contains: query.search.trim() } }] } : {}) }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) { verifySupportToken(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id }, include: { items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } } }); if (!order) throw new NotFoundException('سفارش یافت نشد'); return order; }

  @Patch(':id/tracking')
  async tracking(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: TrackingDto) { verifySupportToken(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order) throw new NotFoundException('سفارش یافت نشد'); return this.prisma.shopOrder.update({ where: { id }, data: { trackingCode: dto.trackingCode, status: order.status === 'pending' ? 'shipped' : order.status, shippingMethodName: dto.shippingCompany ?? order.shippingMethodName } }); }

  @Patch(':id/status')
  async status(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: OrderStatusDto) { verifySupportToken(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order) throw new NotFoundException('سفارش یافت نشد'); return this.prisma.shopOrder.update({ where: { id }, data: { status: dto.status } }); }

  @Post(':id/notify-customer')
  async notify(@Headers('authorization') auth: string, @Param('id') id: string, @Body() body: { message?: string }) { verifySupportToken(auth); const order = await this.prisma.shopOrder.findUnique({ where: { id } }); if (!order) throw new NotFoundException('سفارش یافت نشد'); return { ok: true, orderId: id, recipient: order.customerPhone, message: body.message ?? `وضعیت سفارش ${order.orderNumber} به‌روزرسانی شد` }; }
}
