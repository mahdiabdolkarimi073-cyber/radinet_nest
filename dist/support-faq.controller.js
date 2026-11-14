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
exports.SupportFaqController = void 0;
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
        if (payload.role !== 'admin' && payload.role !== 'support_expert') {
            throw new common_1.UnauthorizedException('دسترسی مجاز نیست');
        }
        return payload;
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class CreateFaqDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFaqDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFaqDto.prototype, "answer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFaqDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateFaqDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFaqDto.prototype, "isPublished", void 0);
class UpdateFaqDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFaqDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFaqDto.prototype, "answer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFaqDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateFaqDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFaqDto.prototype, "isPublished", void 0);
class UpdateSupportContactInfoDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "heroTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "heroSubtitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "mobileNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "workingHours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportContactInfoDto.prototype, "emergencyNotice", void 0);
let SupportFaqController = class SupportFaqController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listFaqs(q, category) {
        const where = { isPublished: true };
        if (category && category !== 'all') {
            where.category = category;
        }
        if (q?.trim()) {
            where.OR = [
                { question: { contains: q.trim(), mode: 'insensitive' } },
                { answer: { contains: q.trim(), mode: 'insensitive' } },
            ];
        }
        return this.prisma.supportFaq.findMany({
            where,
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getContactInfo() {
        let info = await this.prisma.supportContactInfo.findFirst();
        if (!info) {
            info = await this.prisma.supportContactInfo.create({
                data: {
                    heroTitle: 'مرکز پشتیبانی و راهنمایی رادینت',
                    heroSubtitle: 'کارشناسان و متخصصان فنی رادینت در تمامی ساعات در کنار شما هستند.',
                    phoneNumber: '۰۲۱-۸۸۸۸۱۹۲۰',
                    mobileNumber: '۰۹۱۲۰۵۴۵۶۷۸',
                    email: 'support@radinet.ir',
                    workingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰ | پنج‌شنبه‌ها ۸:۰۰ الی ۱۳:۰۰',
                    emergencyNotice: 'واحد تله‌ریپورت اورژانس و پشتیبانی سرورهای ابری به صورت ۲۴ ساعته فعال است.',
                },
            });
        }
        return info;
    }
    async getBundle() {
        const [contactInfo, faqs] = await Promise.all([
            this.getContactInfo(),
            this.listFaqs(),
        ]);
        const categories = Array.from(new Set(faqs.map((f) => f.category))).filter(Boolean);
        return {
            contact_info: {
                id: contactInfo.id,
                hero_title: contactInfo.heroTitle,
                hero_subtitle: contactInfo.heroSubtitle,
                phone_number: contactInfo.phoneNumber,
                mobile_number: contactInfo.mobileNumber,
                email: contactInfo.email,
                working_hours: contactInfo.workingHours,
                emergency_notice: contactInfo.emergencyNotice,
                updated_at: contactInfo.updatedAt.toISOString(),
            },
            faqs: faqs.map((f) => ({
                id: f.id,
                question: f.question,
                answer: f.answer,
                category: f.category,
                display_order: f.displayOrder,
                is_published: f.isPublished,
                created_at: f.createdAt.toISOString(),
                updated_at: f.updatedAt.toISOString(),
            })),
            categories: categories.length > 0 ? categories : ['تله‌رادیولوژی', 'فنی و پکس', 'مالی و تعرفه', 'عمومی'],
        };
    }
    // ── Admin Management Routes ──
    async adminListFaqs(auth) {
        verifyAdmin(auth);
        return this.prisma.supportFaq.findMany({
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async createFaq(auth, dto) {
        verifyAdmin(auth);
        return this.prisma.supportFaq.create({
            data: {
                question: dto.question.trim(),
                answer: dto.answer.trim(),
                category: dto.category?.trim() || 'general',
                displayOrder: dto.displayOrder ?? 0,
                isPublished: dto.isPublished ?? true,
            },
        });
    }
    async updateFaq(auth, id, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.supportFaq.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('سوال متداول یافت نشد');
        return this.prisma.supportFaq.update({
            where: { id },
            data: dto,
        });
    }
    async deleteFaq(auth, id) {
        verifyAdmin(auth);
        const existing = await this.prisma.supportFaq.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('سوال متداول یافت نشد');
        await this.prisma.supportFaq.delete({ where: { id } });
        return { ok: true, message: 'سوال متداول با موفقیت حذف شد' };
    }
    async updateContactInfo(auth, dto) {
        verifyAdmin(auth);
        const existing = await this.prisma.supportContactInfo.findFirst();
        if (existing) {
            return this.prisma.supportContactInfo.update({
                where: { id: existing.id },
                data: dto,
            });
        }
        return this.prisma.supportContactInfo.create({
            data: {
                heroTitle: dto.heroTitle ?? 'مرکز پشتیبانی و راهنمایی رادینت',
                heroSubtitle: dto.heroSubtitle ?? 'کارشناسان و متخصصان فنی رادینت در تمامی ساعات در کنار شما هستند.',
                phoneNumber: dto.phoneNumber ?? '۰۲۱-۸۸۸۸۱۹۲۰',
                mobileNumber: dto.mobileNumber ?? '۰۹۱۲۰۵۴۵۶۷۸',
                email: dto.email ?? 'support@radinet.ir',
                workingHours: dto.workingHours ?? 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰',
                emergencyNotice: dto.emergencyNotice ?? 'واحد تله‌ریپورت اورژانس ۲۴/۷ فعال است.',
            },
        });
    }
};
exports.SupportFaqController = SupportFaqController;
__decorate([
    (0, common_1.Get)('faqs'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "listFaqs", null);
__decorate([
    (0, common_1.Get)('contact-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "getContactInfo", null);
__decorate([
    (0, common_1.Get)('bundle'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "getBundle", null);
__decorate([
    (0, common_1.Get)('admin/faqs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "adminListFaqs", null);
__decorate([
    (0, common_1.Post)('admin/faqs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateFaqDto]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "createFaq", null);
__decorate([
    (0, common_1.Patch)('admin/faqs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateFaqDto]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "updateFaq", null);
__decorate([
    (0, common_1.Delete)('admin/faqs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "deleteFaq", null);
__decorate([
    (0, common_1.Patch)('admin/contact-info'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateSupportContactInfoDto]),
    __metadata("design:returntype", Promise)
], SupportFaqController.prototype, "updateContactInfo", null);
exports.SupportFaqController = SupportFaqController = __decorate([
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportFaqController);
