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
exports.ReportArchiveController = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function extractUser(auth) {
    if (!auth?.startsWith('Bearer '))
        return null;
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (!payload.sub)
            return null;
        return { id: payload.sub, name: payload.name ?? '', role: payload.role ?? 'user' };
    }
    catch {
        return null;
    }
}
let ReportArchiveController = class ReportArchiveController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listArchive(status, search, from, to, pageParam, limitParam, auth) {
        const user = extractUser(auth);
        if (!user)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
        if (user.role !== 'radiologist')
            throw new common_1.ForbiddenException('دسترسی به پنل پزشک تنها برای رادیولوژیست‌ها مجاز است');
        const page = Math.max(Number.parseInt(pageParam ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(limitParam ?? '8', 10) || 8, 1), 50);
        const where = { authorId: user.id };
        if (status && status !== 'all')
            where.status = status;
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
            if (to)
                where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
        }
        if (search?.trim()) {
            const value = search.trim();
            where.OR = [
                { findings: { contains: value, mode: 'insensitive' } },
                { conclusion: { contains: value, mode: 'insensitive' } },
                { request: { requestNumber: { contains: value, mode: 'insensitive' } } },
                { request: { patientFirstName: { contains: value, mode: 'insensitive' } } },
                { request: { patientLastName: { contains: value, mode: 'insensitive' } } },
            ];
        }
        const [total, reports] = await Promise.all([
            this.prisma.radiologyReport.count({ where }),
            this.prisma.radiologyReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    author: { select: { id: true, fullName: true } },
                    images: { select: { id: true, originalName: true, storedName: true, mimeType: true } },
                    request: {
                        select: {
                            id: true,
                            requestNumber: true,
                            patientFirstName: true,
                            patientLastName: true,
                            imagingType: true,
                            imagingArea: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            }),
        ]);
        const allCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id } });
        const draftCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, status: 'draft' } });
        const finalCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, status: 'final' } });
        const signedCount = await this.prisma.radiologyReport.count({ where: { authorId: user.id, signed: true } });
        return {
            items: reports,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
            stats: {
                total: allCount,
                draft: draftCount,
                final: finalCount,
                signed: signedCount,
            },
        };
    }
};
exports.ReportArchiveController = ReportArchiveController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportArchiveController.prototype, "listArchive", null);
exports.ReportArchiveController = ReportArchiveController = __decorate([
    (0, common_1.Controller)('dashboard/report-archive'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportArchiveController);
