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
exports.SupportReviewController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
class ReviewQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'approved', 'rejected']),
    __metadata("design:type", String)
], ReviewQueryDto.prototype, "status", void 0);
class RejectDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], RejectDto.prototype, "reason", void 0);
let SupportReviewController = class SupportReviewController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pending(auth) { (0, support_auth_1.verifySupportToken)(auth); return this.find('pending'); }
    async all(auth, query) { (0, support_auth_1.verifySupportToken)(auth); return this.find(query.status); }
    async detail(auth, id) { (0, support_auth_1.verifySupportToken)(auth); const review = await this.prisma.review.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } } } }); if (!review)
        throw new common_1.NotFoundException('نظر یافت نشد'); return review; }
    async approve(auth, id) { const identity = (0, support_auth_1.verifySupportToken)(auth); return this.update(id, { status: 'approved', reviewedAt: new Date(), reviewedBy: identity.id }); }
    async reject(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review)
            throw new common_1.NotFoundException('نظر یافت نشد');
        await this.prisma.review.delete({ where: { id } });
        return { id, status: 'rejected', deleted: true, rejectReason: dto?.reason || null };
    }
    find(status) { return this.prisma.review.findMany({ where: status && status !== 'all' ? { status } : {}, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } }); }
    async update(id, data) { const review = await this.prisma.review.findUnique({ where: { id } }); if (!review)
        throw new common_1.NotFoundException('نظر یافت نشد'); return this.prisma.review.update({ where: { id }, data }); }
};
exports.SupportReviewController = SupportReviewController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupportReviewController.prototype, "pending", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReviewQueryDto]),
    __metadata("design:returntype", Promise)
], SupportReviewController.prototype, "all", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportReviewController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportReviewController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, RejectDto]),
    __metadata("design:returntype", Promise)
], SupportReviewController.prototype, "reject", null);
exports.SupportReviewController = SupportReviewController = __decorate([
    (0, common_1.Controller)('support/reviews'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportReviewController);
