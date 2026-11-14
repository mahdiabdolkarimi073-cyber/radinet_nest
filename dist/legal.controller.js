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
exports.LegalController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
class LegalDocumentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LegalDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LegalDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LegalDocumentDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LegalDocumentDto.prototype, "versionNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], LegalDocumentDto.prototype, "effectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], LegalDocumentDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], LegalDocumentDto.prototype, "scheduledPublishDate", void 0);
class ChangeLogDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeLogDto.prototype, "documentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeLogDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeLogDto.prototype, "actor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeLogDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeLogDto.prototype, "summary", void 0);
class ConsentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsentDto.prototype, "userIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ConsentDto.prototype, "documentVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsentDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsentDto.prototype, "userAgent", void 0);
let LegalController = class LegalController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDocument(type) {
        const doc = await this.prisma.legalDocument.findFirst({
            where: { documentType: type, isActive: true },
        });
        return doc ?? null;
    }
    async getAllDocuments() {
        return this.prisma.legalDocument.findMany({ where: { isActive: true } });
    }
    async createDocument(body) {
        await this.prisma.legalDocument.updateMany({
            where: { documentType: body.documentType, isActive: true },
            data: { isActive: false },
        });
        const doc = await this.prisma.legalDocument.create({ data: body });
        await this.prisma.legalChangeLog.create({
            data: {
                documentId: doc.id,
                documentType: body.documentType,
                actor: 'admin',
                action: 'create',
                summary: `نسخه ${body.versionNumber ?? 1} از سند ${body.documentType} ایجاد شد`,
            },
        });
        return doc;
    }
    async updateDocument(id, body) {
        const existing = await this.prisma.legalDocument.findUnique({ where: { id } });
        if (!existing)
            return null;
        if (existing.versionNumber !== body.versionNumber) {
            await this.prisma.legalDocumentVersion.create({
                data: {
                    documentId: existing.id,
                    documentType: existing.documentType,
                    title: existing.title,
                    content: existing.content,
                    versionNumber: existing.versionNumber,
                    effectiveDate: existing.effectiveDate,
                },
            });
        }
        const doc = await this.prisma.legalDocument.update({ where: { id }, data: body });
        await this.prisma.legalChangeLog.create({
            data: {
                documentId: id,
                documentType: existing.documentType,
                actor: 'admin',
                action: 'update',
                summary: `سند ${existing.documentType} به نسخه ${body.versionNumber ?? existing.versionNumber} بروزرسانی شد`,
            },
        });
        return doc;
    }
    async getVersions(type) {
        return this.prisma.legalDocumentVersion.findMany({
            where: { documentType: type },
            orderBy: { archivedAt: 'desc' },
        });
    }
    async getChangeLogs() {
        return this.prisma.legalChangeLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    }
    async createChangeLog(body) {
        return this.prisma.legalChangeLog.create({ data: body });
    }
    async recordConsent(body) {
        return this.prisma.legalConsent.create({ data: body });
    }
    async getConsents(identifier) {
        return this.prisma.legalConsent.findMany({
            where: { userIdentifier: identifier },
            orderBy: { acceptedAt: 'desc' },
        });
    }
    async getViewLogs() {
        return this.prisma.legalViewLog.findMany({ orderBy: { viewedAt: 'desc' }, take: 100 });
    }
};
exports.LegalController = LegalController;
__decorate([
    (0, common_1.Get)(':type'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getAllDocuments", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LegalDocumentDto]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "updateDocument", null);
__decorate([
    (0, common_1.Get)('versions/:type'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Get)('logs/changes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getChangeLogs", null);
__decorate([
    (0, common_1.Post)('logs/changes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChangeLogDto]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "createChangeLog", null);
__decorate([
    (0, common_1.Post)('consents'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConsentDto]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "recordConsent", null);
__decorate([
    (0, common_1.Get)('consents/:identifier'),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getConsents", null);
__decorate([
    (0, common_1.Get)('logs/views'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalController.prototype, "getViewLogs", null);
exports.LegalController = LegalController = __decorate([
    (0, common_1.Controller)('legal'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LegalController);
