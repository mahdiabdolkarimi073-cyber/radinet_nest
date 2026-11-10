import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { PrismaService } from './prisma.service';

class ContactMessageDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() phone!: string;
  @IsString() subject!: string;
  @IsString() message!: string;
}

class ContactPageDto {
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() introTitle?: string;
  @IsOptional() @IsString() introBody?: string;
  @IsOptional() @IsString() officeAddress?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() mapUrl?: string;
  @IsOptional() @IsString() responseHours?: string;
}

class PhoneDto {
  @IsString() label!: string;
  @IsString() phone!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

class EmailDto {
  @IsString() label!: string;
  @IsString() email!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

class HoursDto {
  @IsString() dayLabel!: string;
  @IsString() hours!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPublic() {
    const [page, phones, emails, hours] = await Promise.all([
      this.prisma.contactPageContent.findFirst(),
      this.prisma.contactPhoneNumber.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      this.prisma.contactSupportEmail.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      this.prisma.contactResponseHour.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    ]);
    return { page, phones, emails, hours };
  }

  @Post('messages')
  createMessage(@Body() body: ContactMessageDto) {
    return this.prisma.contactMessage.create({ data: body });
  }

  @Get('messages')
  listMessages() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Patch('messages/:id')
  updateMessage(@Param('id') id: string, @Body() body: Partial<ContactMessageDto> & { status?: string }) {
    return this.prisma.contactMessage.update({ where: { id }, data: body });
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }

  @Patch('page')
  async updatePage(@Body() body: ContactPageDto) {
    const existing = await this.prisma.contactPageContent.findFirst();
    if (existing) {
      return this.prisma.contactPageContent.update({ where: { id: existing.id }, data: body });
    }
    return this.prisma.contactPageContent.create({ data: body });
  }

  @Post('phones')
  createPhone(@Body() body: PhoneDto) {
    return this.prisma.contactPhoneNumber.create({ data: body });
  }

  @Patch('phones/:id')
  updatePhone(@Param('id') id: string, @Body() body: Partial<PhoneDto>) {
    return this.prisma.contactPhoneNumber.update({ where: { id }, data: body });
  }

  @Delete('phones/:id')
  deletePhone(@Param('id') id: string) {
    return this.prisma.contactPhoneNumber.delete({ where: { id } });
  }

  @Post('emails')
  createEmail(@Body() body: EmailDto) {
    return this.prisma.contactSupportEmail.create({ data: body });
  }

  @Patch('emails/:id')
  updateEmail(@Param('id') id: string, @Body() body: Partial<EmailDto>) {
    return this.prisma.contactSupportEmail.update({ where: { id }, data: body });
  }

  @Delete('emails/:id')
  deleteEmail(@Param('id') id: string) {
    return this.prisma.contactSupportEmail.delete({ where: { id } });
  }

  @Post('hours')
  createHours(@Body() body: HoursDto) {
    return this.prisma.contactResponseHour.create({ data: body });
  }

  @Patch('hours/:id')
  updateHours(@Param('id') id: string, @Body() body: Partial<HoursDto>) {
    return this.prisma.contactResponseHour.update({ where: { id }, data: body });
  }

  @Delete('hours/:id')
  deleteHours(@Param('id') id: string) {
    return this.prisma.contactResponseHour.delete({ where: { id } });
  }
}
