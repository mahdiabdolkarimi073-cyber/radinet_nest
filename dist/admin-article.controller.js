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
exports.AdminArticleController = exports.UpdateArticleDto = exports.CreateArticleDto = void 0;
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
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0600-\u06FF\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
class CreateArticleDto {
}
exports.CreateArticleDto = CreateArticleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "author", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateArticleDto.prototype, "isPublished", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "publishedAt", void 0);
class UpdateArticleDto {
}
exports.UpdateArticleDto = UpdateArticleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "author", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateArticleDto.prototype, "isPublished", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "publishedAt", void 0);
let AdminArticleController = class AdminArticleController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listArticles(auth) {
        verifyAdmin(auth);
        return this.prisma.article.findMany({
            orderBy: [{ createdAt: 'desc' }],
        });
    }
    async getArticle(auth, id) {
        verifyAdmin(auth);
        const article = await this.prisma.article.findUnique({
            where: { id },
        });
        if (!article) {
            throw new common_1.NotFoundException('مقاله مورد نظر یافت نشد');
        }
        return article;
    }
    async createArticle(auth, dto) {
        const adminUser = verifyAdmin(auth);
        let cleanSlug = dto.slug?.trim() || slugify(dto.title);
        if (!cleanSlug)
            cleanSlug = `article-${Date.now()}`;
        // ensure unique slug
        const existing = await this.prisma.article.findUnique({
            where: { slug: cleanSlug },
        });
        if (existing) {
            cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
        }
        const isPublished = dto.isPublished ?? true;
        const publishedAt = dto.publishedAt
            ? new Date(dto.publishedAt)
            : isPublished
                ? new Date()
                : null;
        const adminFullName = typeof adminUser.fullName === 'string' ? adminUser.fullName : undefined;
        return this.prisma.article.create({
            data: {
                title: dto.title,
                slug: cleanSlug,
                summary: dto.summary,
                content: dto.content,
                imageUrl: dto.imageUrl ?? '',
                category: dto.category ?? 'عمومی',
                author: dto.author?.trim() || adminFullName || 'تیم تحریریه رادینت',
                isPublished,
                publishedAt,
            },
        });
    }
    async updateArticle(auth, id, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.article.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('مقاله مورد نظر یافت نشد');
        }
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.slug !== undefined && dto.slug.trim() !== '') {
            data.slug = slugify(dto.slug);
        }
        if (dto.summary !== undefined)
            data.summary = dto.summary;
        if (dto.content !== undefined)
            data.content = dto.content;
        if (dto.imageUrl !== undefined)
            data.imageUrl = dto.imageUrl;
        if (dto.category !== undefined)
            data.category = dto.category;
        if (dto.author !== undefined)
            data.author = dto.author;
        if (dto.isPublished !== undefined) {
            data.isPublished = dto.isPublished;
            if (dto.isPublished && !existing.publishedAt && !dto.publishedAt) {
                data.publishedAt = new Date();
            }
        }
        if (dto.publishedAt !== undefined) {
            data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
        }
        return this.prisma.article.update({
            where: { id },
            data,
        });
    }
    async deleteArticle(auth, id) {
        verifyAdmin(auth);
        const existing = await this.prisma.article.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('مقاله مورد نظر یافت نشد');
        }
        await this.prisma.article.delete({
            where: { id },
        });
        return { ok: true, message: 'مقاله با موفقیت حذف شد' };
    }
};
exports.AdminArticleController = AdminArticleController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminArticleController.prototype, "listArticles", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminArticleController.prototype, "getArticle", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateArticleDto]),
    __metadata("design:returntype", Promise)
], AdminArticleController.prototype, "createArticle", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateArticleDto]),
    __metadata("design:returntype", Promise)
], AdminArticleController.prototype, "updateArticle", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminArticleController.prototype, "deleteArticle", null);
exports.AdminArticleController = AdminArticleController = __decorate([
    (0, common_1.Controller)('admin/articles'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminArticleController);
