"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeleReportController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
class TeleReportSettingsDto {
}
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TeleReportSettingsDto.prototype, "settingValue", void 0);
let TeleReportController = class TeleReportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        const setting = await this.prisma.siteSetting.findUnique({
            where: { settingKey: 'tele_report' },
        });
        return setting?.settingValue ?? {};
    }
    async getAiConfig() {
        const setting = (await this.prisma.siteSetting.findUnique({ where: { settingKey: 'ai_analysis_global' } })) ??
            (await this.prisma.siteSetting.findUnique({ where: { settingKey: 'ai_settings' } }));
        const value = setting?.settingValue && typeof setting.settingValue === 'object' && !Array.isArray(setting.settingValue)
            ? setting.settingValue
            : {};
        return {
            aiAnalysisEnabled: typeof value.aiAnalysisEnabled === 'boolean'
                ? value.aiAnalysisEnabled
                : typeof value.enabled === 'boolean'
                    ? value.enabled
                    : true,
            aiPricingEnabled: typeof value.aiPricingEnabled === 'boolean' ? value.aiPricingEnabled : true,
            suggestedPrice: typeof value.suggestedPrice === 'number' && Number.isFinite(value.suggestedPrice)
                ? Math.round(value.suggestedPrice)
                : 950000,
            currency: typeof value.currency === 'string' && value.currency ? value.currency : 'IRR',
            updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
        };
    }
    async saveSettings(body) {
        return this.prisma.siteSetting.upsert({
            where: { settingKey: 'tele_report' },
            create: { settingKey: 'tele_report', settingValue: body.settingValue },
            update: { settingValue: body.settingValue },
        });
    }
};
exports.TeleReportController = TeleReportController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TeleReportController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Get)('ai-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TeleReportController.prototype, "getAiConfig", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TeleReportSettingsDto]),
    __metadata("design:returntype", Promise)
], TeleReportController.prototype, "saveSettings", null);
exports.TeleReportController = TeleReportController = __decorate([
    (0, common_1.Controller)('tele-report'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeleReportController);
