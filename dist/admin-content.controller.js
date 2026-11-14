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
exports.AdminContentController = void 0;
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
const VALID_PAGE_KEYS = ['home', 'about', 'contact', 'legal', 'privacy'];
class UpdatePageContentDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePageContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePageContentDto.prototype, "subtitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePageContentDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePageContentDto.prototype, "metaDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePageContentDto.prototype, "isActive", void 0);
let AdminContentController = class AdminContentController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPages(auth) {
        verifyAdmin(auth);
        return this.prisma.publicPageContent.findMany({
            orderBy: [{ pageKey: 'asc' }],
        });
    }
    async getPage(auth, pageKey) {
        verifyAdmin(auth);
        if (!VALID_PAGE_KEYS.includes(pageKey)) {
            throw new common_1.NotFoundException('صفحه نامعتبر است');
        }
        let page = await this.prisma.publicPageContent.findUnique({
            where: { pageKey },
        });
        if (!page) {
            const defaults = {
                home: { title: 'صفحه اصلی', subtitle: 'خوش آمدید به رادینت' },
                about: { title: 'درباره ما', subtitle: 'درباره رادینت رادیولوژی' },
                contact: { title: 'تماس با ما', subtitle: 'با ما در ارتباط باشید' },
                legal: { title: 'قوانین و مقررات', subtitle: 'قوانین و شرایط استفاده' },
                privacy: { title: 'حریم خصوصی', subtitle: 'سیاست حفظ حریم خصوصی' },
            };
            const def = defaults[pageKey];
            page = await this.prisma.publicPageContent.create({
                data: {
                    pageKey,
                    title: def.title,
                    subtitle: def.subtitle,
                },
            });
        }
        return page;
    }
    async updatePage(auth, pageKey, dto) {
        verifyAdmin(auth);
        if (!VALID_PAGE_KEYS.includes(pageKey)) {
            throw new common_1.NotFoundException('صفحه نامعتبر است');
        }
        let page = await this.prisma.publicPageContent.findUnique({
            where: { pageKey },
        });
        if (!page) {
            const defaults = {
                home: { title: 'صفحه اصلی', subtitle: 'خوش آمدید به رادینت' },
                about: { title: 'درباره ما', subtitle: 'درباره رادینت رادیولوژی' },
                contact: { title: 'تماس با ما', subtitle: 'با ما در ارتباط باشید' },
                legal: { title: 'قوانین و مقررات', subtitle: 'قوانین و شرایط استفاده' },
                privacy: { title: 'حریم خصوصی', subtitle: 'سیاست حفظ حریم خصوصی' },
            };
            const def = defaults[pageKey];
            page = await this.prisma.publicPageContent.create({
                data: {
                    pageKey,
                    title: dto.title ?? def.title,
                    subtitle: dto.subtitle ?? def.subtitle,
                    content: dto.content ?? '',
                    metaDescription: dto.metaDescription ?? '',
                    isActive: dto.isActive ?? true,
                },
            });
            return page;
        }
        return this.prisma.publicPageContent.update({
            where: { pageKey },
            data: dto,
        });
    }
};
exports.AdminContentController = AdminContentController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminContentController.prototype, "listPages", null);
__decorate([
    (0, common_1.Get)(':pageKey'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('pageKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminContentController.prototype, "getPage", null);
__decorate([
    (0, common_1.Patch)(':pageKey'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('pageKey')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdatePageContentDto]),
    __metadata("design:returntype", Promise)
], AdminContentController.prototype, "updatePage", null);
exports.AdminContentController = AdminContentController = __decorate([
    (0, common_1.Controller)('admin/content'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminContentController);
