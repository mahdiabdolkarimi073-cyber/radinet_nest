import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { PrismaService } from './prisma.service';

class TeleReportSettingsDto {
  @IsObject()
  settingValue!: Record<string, unknown>;
}

@Controller('tele-report')
export class TeleReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getSettings() {
    const setting = await this.prisma.siteSetting.findUnique({
      where: { settingKey: 'tele_report' },
    });

    return setting?.settingValue ?? {};
  }

  @Put()
  async saveSettings(@Body() body: TeleReportSettingsDto) {
    return this.prisma.siteSetting.upsert({
      where: { settingKey: 'tele_report' },
      create: { settingKey: 'tele_report', settingValue: body.settingValue as never },
      update: { settingValue: body.settingValue as never },
    });
  }
}
