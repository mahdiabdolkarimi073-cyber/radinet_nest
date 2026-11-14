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
exports.AdminCommunicationController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const auth_token_1 = require("./auth-token");
class AdminCommunicationQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCommunicationQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCommunicationQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCommunicationQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCommunicationQueryDto.prototype, "limit", void 0);
class UpdateCommunicationDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommunicationDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommunicationDto.prototype, "adminNote", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommunicationDto.prototype, "adminMessage", void 0);
let AdminCommunicationController = class AdminCommunicationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCommunications(authHeader, query) {
        (0, auth_token_1.verifyAdminToken)(authHeader);
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        if (query.status && query.status !== 'all') {
            where.status = query.status;
        }
        if (query.search?.trim()) {
            const q = query.search.trim();
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { body: { contains: q, mode: 'insensitive' } },
                { response: { contains: q, mode: 'insensitive' } },
                { request: { requestNumber: { contains: q, mode: 'insensitive' } } },
                { request: { patientFirstName: { contains: q, mode: 'insensitive' } } },
                { request: { patientLastName: { contains: q, mode: 'insensitive' } } },
                { author: { fullName: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [total, items, openCount, answeredCount, closedCount] = await Promise.all([
            this.prisma.infoRequest.count({ where }),
            this.prisma.infoRequest.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    author: { select: { id: true, fullName: true, email: true } },
                    request: {
                        select: {
                            id: true,
                            requestNumber: true,
                            patientFirstName: true,
                            patientLastName: true,
                            phone: true,
                            imagingType: true,
                            imagingArea: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.infoRequest.count({ where: { status: 'open' } }),
            this.prisma.infoRequest.count({ where: { status: 'answered' } }),
            this.prisma.infoRequest.count({ where: { status: 'closed' } }),
        ]);
        return {
            items: items.map((ir) => ({
                id: ir.id,
                requestId: ir.requestId,
                requestNumber: ir.request?.requestNumber || '—',
                patientName: ir.request
                    ? `${ir.request.patientFirstName} ${ir.request.patientLastName}`.trim()
                    : 'بیمار',
                patientPhone: ir.request?.phone || '—',
                doctorName: ir.author?.fullName || 'پزشک رادیولوژیست',
                imagingType: ir.request?.imagingType || '—',
                imagingArea: ir.request?.imagingArea || 'عمومی',
                subject: ir.title,
                message: ir.body,
                response: ir.response,
                status: ir.status,
                adminNote: ir.adminNote || null,
                messages: Array.isArray(ir.messages) ? ir.messages : [],
                createdAt: ir.createdAt.toISOString(),
                updatedAt: ir.updatedAt.toISOString(),
            })),
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
            counts: {
                all: openCount + answeredCount + closedCount,
                open: openCount,
                answered: answeredCount,
                closed: closedCount,
            },
        };
    }
    async updateCommunication(authHeader, id, dto) {
        const admin = (0, auth_token_1.verifyAdminToken)(authHeader);
        const existing = await this.prisma.infoRequest.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('مکالمه یا درخواست اطلاعات تکمیلی یافت نشد');
        if (dto.status && !['open', 'answered', 'closed'].includes(dto.status)) {
            throw new common_1.BadRequestException('وضعیت پیگیری نامعتبر است');
        }
        const prevMessages = Array.isArray(existing.messages)
            ? [...existing.messages]
            : [];
        if (dto.adminMessage?.trim()) {
            prevMessages.push({
                id: `msg-${Date.now()}`,
                senderRole: 'admin',
                senderId: admin.userId,
                senderName: 'مدیر سامانه',
                message: dto.adminMessage.trim(),
                createdAt: new Date().toISOString(),
            });
        }
        const updated = await this.prisma.infoRequest.update({
            where: { id },
            data: {
                ...(dto.status ? { status: dto.status } : {}),
                ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote.trim() || null } : {}),
                ...(dto.adminMessage?.trim() ? { messages: prevMessages } : {}),
            },
        });
        return updated;
    }
};
exports.AdminCommunicationController = AdminCommunicationController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AdminCommunicationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCommunicationController.prototype, "listCommunications", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateCommunicationDto]),
    __metadata("design:returntype", Promise)
], AdminCommunicationController.prototype, "updateCommunication", null);
exports.AdminCommunicationController = AdminCommunicationController = __decorate([
    (0, common_1.Controller)('admin/communications'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminCommunicationController);
