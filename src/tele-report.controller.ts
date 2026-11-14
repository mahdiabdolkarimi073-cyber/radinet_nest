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

  @Get('ai-config')
  async getAiConfig() {
    const setting =
      (await this.prisma.siteSetting.findUnique({ where: { settingKey: 'ai_analysis_global' } })) ??
      (await this.prisma.siteSetting.findUnique({ where: { settingKey: 'ai_settings' } }));

    const value =
      setting?.settingValue && typeof setting.settingValue === 'object' && !Array.isArray(setting.settingValue)
        ? (setting.settingValue as Record<string, unknown>)
        : {};

    return {
      aiAnalysisEnabled:
        typeof value.aiAnalysisEnabled === 'boolean'
          ? value.aiAnalysisEnabled
          : typeof value.enabled === 'boolean'
            ? value.enabled
            : true,
      aiPricingEnabled: typeof value.aiPricingEnabled === 'boolean' ? value.aiPricingEnabled : true,
      suggestedPrice:
        typeof value.suggestedPrice === 'number' && Number.isFinite(value.suggestedPrice)
          ? Math.round(value.suggestedPrice)
          : 950000,
      currency: typeof value.currency === 'string' && value.currency ? value.currency : 'IRR',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    };
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
