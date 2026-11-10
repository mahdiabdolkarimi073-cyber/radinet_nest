import { Body, Controller, Get, Headers, Param, Patch, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class ReviewQueryDto { @IsOptional() @IsIn(['pending', 'approved', 'rejected']) status?: string; }
class RejectDto { @IsString() @MinLength(1) reason!: string; }

@Controller('support/reviews')
@UseGuards(SupportExpertGuard)
export class SupportReviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async pending(@Headers('authorization') auth: string) { verifySupportToken(auth); return this.find('pending'); }
  @Get('all')
  async all(@Headers('authorization') auth: string, @Query() query: ReviewQueryDto) { verifySupportToken(auth); return this.find(query.status); }
  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) { verifySupportToken(auth); const review = await this.prisma.review.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } } } }); if (!review) throw new NotFoundException('نظر یافت نشد'); return review; }
  @Patch(':id/approve')
  async approve(@Headers('authorization') auth: string, @Param('id') id: string) { const identity = verifySupportToken(auth); return this.update(id, { status: 'approved', reviewedAt: new Date(), reviewedBy: identity.id }); }
  @Patch(':id/reject')
  async reject(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: RejectDto) {
    verifySupportToken(auth);
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    await this.prisma.review.delete({ where: { id } });
    return { id, status: 'rejected', deleted: true, rejectReason: dto?.reason || null };
  }

  private find(status?: string) { return this.prisma.review.findMany({ where: status && status !== 'all' ? { status } : {}, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } }); }
  private async update(id: string, data: { status: string; rejectReason?: string; reviewedAt: Date; reviewedBy: string }) { const review = await this.prisma.review.findUnique({ where: { id } }); if (!review) throw new NotFoundException('نظر یافت نشد'); return this.prisma.review.update({ where: { id }, data }); }
}
