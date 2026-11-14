"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AboutController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function verifyAdmin(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (payload.role !== 'admin')
            throw new common_1.UnauthorizedException('دسترسی مجاز نیست');
        return payload;
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class ContentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ContentDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ContentDto.prototype, "displayOrder", void 0);
class MediaDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MediaDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MediaDto.prototype, "isActive", void 0);
class CertificateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateDto.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CertificateDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CertificateDto.prototype, "isActive", void 0);
let AboutController = class AboutController {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
            team: media.filter((item) => item.kind === 'team'),
            office: media.filter((item) => item.kind === 'office'),
            certificates,
            contactLink: contactLinkItem?.body || '/contact',
        };
    }
    // ── Content Management ──
    createContent(auth, body) {
        verifyAdmin(auth);
        return this.prisma.aboutContent.create({ data: body });
    }
    updateContent(auth, id, body) {
        verifyAdmin(auth);
        return this.prisma.aboutContent.update({ where: { id }, data: body });
    }
    deleteContent(auth, id) {
        verifyAdmin(auth);
        return this.prisma.aboutContent.delete({ where: { id } });
    }
    // ── Media Management (Team / Office) ──
    createMedia(auth, body) {
        verifyAdmin(auth);
        return this.prisma.aboutMedia.create({ data: body });
    }
    updateMedia(auth, id, body) {
        verifyAdmin(auth);
        return this.prisma.aboutMedia.update({ where: { id }, data: body });
    }
    deleteMedia(auth, id) {
        verifyAdmin(auth);
        return this.prisma.aboutMedia.delete({ where: { id } });
    }
    // ── Certificates Management ──
    createCertificate(auth, body) {
        verifyAdmin(auth);
        return this.prisma.certificate.create({ data: body });
    }
    updateCertificate(auth, id, body) {
        verifyAdmin(auth);
        return this.prisma.certificate.update({ where: { id }, data: body });
    }
    deleteCertificate(auth, id) {
        verifyAdmin(auth);
        return this.prisma.certificate.delete({ where: { id } });
    }
};
exports.AboutController = AboutController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AboutController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Post)('content'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ContentDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createContent", null);
__decorate([
    (0, common_1.Patch)('content/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateContent", null);
__decorate([
    (0, common_1.Delete)('content/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteContent", null);
__decorate([
    (0, common_1.Post)('media'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MediaDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createMedia", null);
__decorate([
    (0, common_1.Patch)('media/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateMedia", null);
__decorate([
    (0, common_1.Delete)('media/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteMedia", null);
__decorate([
    (0, common_1.Post)('certificates'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CertificateDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createCertificate", null);
__decorate([
    (0, common_1.Patch)('certificates/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateCertificate", null);
__decorate([
    (0, common_1.Delete)('certificates/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteCertificate", null);
exports.AboutController = AboutController = __decorate([
    (0, common_1.Controller)('about'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AboutController);
