import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import * as jwt from 'jsonwebtoken';
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

class ConsultationDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsString()
  @Length(7, 30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  message?: string;
}

class UpdateStatusDto {
  @IsString()
  status!: string;
}

@Controller('consultations')
export class ConsultationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() body: ConsultationDto) {
    return this.prisma.consultationRequest.create({ data: body });
  }

  @Get()
  list(@Headers('authorization') auth?: string) {
    if (auth) verifyAdmin(auth);
    return this.prisma.consultationRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  updateStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    verifyAdmin(auth);
    return this.prisma.consultationRequest.update({
      where: { id },
      data: { status: body.status },
    });
  }

  @Delete(':id')
  delete(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    verifyAdmin(auth);
    return this.prisma.consultationRequest.delete({
      where: { id },
    });
  }
}