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
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
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

class ContentDto {
  @IsString()
  key!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

class MediaDto {
  @IsString()
  kind!: string;

  @IsString()
  title!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class CertificateDto {
  @IsString()
  title!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('about')
export class AboutController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPublic() {
    const [content, media, certificates] = await Promise.all([
      this.prisma.aboutContent.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.aboutMedia.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.certificate.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    const contactLinkItem = content.find((c) => c.key === 'contact_link');

    return {
      content,
      team: media.filter((item: { kind: string }) => item.kind === 'team'),
      office: media.filter((item: { kind: string }) => item.kind === 'office'),
      certificates,
      contactLink: contactLinkItem?.body || '/contact',
    };
  }

  // ── Content Management ──
  @Post('content')
  createContent(@Headers('authorization') auth: string, @Body() body: ContentDto) {
    verifyAdmin(auth);
    return this.prisma.aboutContent.create({ data: body });
  }

  @Patch('content/:id')
  updateContent(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<ContentDto>,
  ) {
    verifyAdmin(auth);
    return this.prisma.aboutContent.update({ where: { id }, data: body });
  }

  @Delete('content/:id')
  deleteContent(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    return this.prisma.aboutContent.delete({ where: { id } });
  }

  // ── Media Management (Team / Office) ──
  @Post('media')
  createMedia(@Headers('authorization') auth: string, @Body() body: MediaDto) {
    verifyAdmin(auth);
    return this.prisma.aboutMedia.create({ data: body });
  }

  @Patch('media/:id')
  updateMedia(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<MediaDto>,
  ) {
    verifyAdmin(auth);
    return this.prisma.aboutMedia.update({ where: { id }, data: body });
  }

  @Delete('media/:id')
  deleteMedia(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    return this.prisma.aboutMedia.delete({ where: { id } });
  }

  // ── Certificates Management ──
  @Post('certificates')
  createCertificate(@Headers('authorization') auth: string, @Body() body: CertificateDto) {
    verifyAdmin(auth);
    return this.prisma.certificate.create({ data: body });
  }

  @Patch('certificates/:id')
  updateCertificate(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: Partial<CertificateDto>,
  ) {
    verifyAdmin(auth);
    return this.prisma.certificate.update({ where: { id }, data: body });
  }

  @Delete('certificates/:id')
  deleteCertificate(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    return this.prisma.certificate.delete({ where: { id } });
  }
}