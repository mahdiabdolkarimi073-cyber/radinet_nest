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
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
class ContactMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactMessageDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ContactMessageDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactMessageDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactMessageDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactMessageDto.prototype, "message", void 0);
class ContactPageDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "heroTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "heroSubtitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "introTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "introBody", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "officeAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ContactPageDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ContactPageDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "mapUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactPageDto.prototype, "responseHours", void 0);
class PhoneDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PhoneDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PhoneDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhoneDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PhoneDto.prototype, "displayOrder", void 0);
class EmailDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], EmailDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EmailDto.prototype, "displayOrder", void 0);
class HoursDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HoursDto.prototype, "dayLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HoursDto.prototype, "hours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], HoursDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], HoursDto.prototype, "displayOrder", void 0);
let ContactController = class ContactController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublic() {
        const [page, phones, emails, hours] = await Promise.all([
            this.prisma.contactPageContent.findFirst(),
            this.prisma.contactPhoneNumber.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            this.prisma.contactSupportEmail.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            this.prisma.contactResponseHour.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        ]);
        return { page, phones, emails, hours };
    }
    createMessage(body) {
        return this.prisma.contactMessage.create({ data: body });
    }
    listMessages() {
        return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    }
    updateMessage(id, body) {
        return this.prisma.contactMessage.update({ where: { id }, data: body });
    }
    deleteMessage(id) {
        return this.prisma.contactMessage.delete({ where: { id } });
    }
    async updatePage(body) {
        const existing = await this.prisma.contactPageContent.findFirst();
        if (existing) {
            return this.prisma.contactPageContent.update({ where: { id: existing.id }, data: body });
        }
        return this.prisma.contactPageContent.create({ data: body });
    }
    createPhone(body) {
        return this.prisma.contactPhoneNumber.create({ data: body });
    }
    updatePhone(id, body) {
        return this.prisma.contactPhoneNumber.update({ where: { id }, data: body });
    }
    deletePhone(id) {
        return this.prisma.contactPhoneNumber.delete({ where: { id } });
    }
    createEmail(body) {
        return this.prisma.contactSupportEmail.create({ data: body });
    }
    updateEmail(id, body) {
        return this.prisma.contactSupportEmail.update({ where: { id }, data: body });
    }
    deleteEmail(id) {
        return this.prisma.contactSupportEmail.delete({ where: { id } });
    }
    createHours(body) {
        return this.prisma.contactResponseHour.create({ data: body });
    }
    updateHours(id, body) {
        return this.prisma.contactResponseHour.update({ where: { id }, data: body });
    }
    deleteHours(id) {
        return this.prisma.contactResponseHour.delete({ where: { id } });
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ContactMessageDto]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "createMessage", null);
__decorate([
    (0, common_1.Get)('messages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Patch)('messages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)('page'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ContactPageDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "updatePage", null);
__decorate([
    (0, common_1.Post)('phones'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PhoneDto]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "createPhone", null);
__decorate([
    (0, common_1.Patch)('phones/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "updatePhone", null);
__decorate([
    (0, common_1.Delete)('phones/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "deletePhone", null);
__decorate([
    (0, common_1.Post)('emails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EmailDto]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "createEmail", null);
__decorate([
    (0, common_1.Patch)('emails/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "updateEmail", null);
__decorate([
    (0, common_1.Delete)('emails/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "deleteEmail", null);
__decorate([
    (0, common_1.Post)('hours'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HoursDto]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "createHours", null);
__decorate([
    (0, common_1.Patch)('hours/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "updateHours", null);
__decorate([
    (0, common_1.Delete)('hours/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "deleteHours", null);
exports.ContactController = ContactController = __decorate([
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactController);
