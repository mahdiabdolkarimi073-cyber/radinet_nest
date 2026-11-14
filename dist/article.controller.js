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
exports.ArticleController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let ArticleController = class ArticleController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublishedArticles(limit, category) {
        const take = limit ? parseInt(limit, 10) : undefined;
        const where = { isPublished: true };
        if (category) {
            where.category = category;
        }
        return this.prisma.article.findMany({
            where,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take,
        });
    }
    async getRealStats() {
        const [requestCount, doctorCount, centerCount, activeUserCount] = await Promise.all([
            this.prisma.teleReportRequest.count(),
            this.prisma.doctorProfile.count(),
            this.prisma.imagingCenter.count(),
            this.prisma.user.count({ where: { status: 'active' } }),
        ]);
        return {
            requests: requestCount,
            doctors: doctorCount,
            centers: centerCount,
            activeUsers: activeUserCount,
        };
    }
    async getArticleBySlug(slug) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const article = await this.prisma.article.findFirst({
            where: {
                OR: isUuid ? [{ slug }, { id: slug }] : [{ slug }],
                isPublished: true,
            },
        });
        if (!article) {
            throw new common_1.NotFoundException('مقاله مورد نظر یافت نشد');
        }
        return article;
    }
};
exports.ArticleController = ArticleController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getPublishedArticles", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getRealStats", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getArticleBySlug", null);
exports.ArticleController = ArticleController = __decorate([
    (0, common_1.Controller)('articles'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArticleController);
