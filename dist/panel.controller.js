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
exports.PanelController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function verifyUserToken(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
            throw new common_1.UnauthorizedException('توکن نامعتبر است');
        }
        const role = (payload.role || '').toLowerCase();
        if (role !== 'user' && role !== 'patient') {
            throw new common_1.UnauthorizedException('دسترسی فقط برای بیماران و کاربران عادی مجاز است');
        }
        return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
    }
    catch (error) {
        if (error instanceof common_1.UnauthorizedException)
            throw error;
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
class CreateTicketDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['general', 'technical', 'billing', 'telereport', 'shop']),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high', 'urgent']),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "priority", void 0);
class ReplyTicketDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ReplyTicketDto.prototype, "message", void 0);
class CreateReviewDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "content", void 0);
let PanelController = class PanelController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── 3. Shop Orders ──
    async orders(auth) {
        const identity = verifyUserToken(auth);
        const orders = await this.prisma.shopOrder.findMany({
            where: {
                OR: [{ userId: identity.id }, { customerEmail: identity.email }],
            },
            orderBy: { createdAt: 'desc' },
            include: { items: { select: { id: true, productName: true, quantity: true, unitPrice: true, lineTotal: true } } },
        });
        return { items: orders };
    }
    async orderDetail(auth, id) {
        const identity = verifyUserToken(auth);
        const order = await this.prisma.shopOrder.findFirst({
            where: {
                id,
                OR: [{ userId: identity.id }, { customerEmail: identity.email }],
            },
            include: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException('سفارش یافت نشد');
        return order;
    }
    // ── 4. Telereport Requests ──
    async telereports(auth) {
        const identity = verifyUserToken(auth);
        const items = await this.prisma.teleReportRequest.findMany({
            where: {
                OR: [{ userId: identity.id }, { phone: identity.email }],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                attachments: { select: { id: true, originalName: true, storedName: true, mimeType: true, size: true } },
                reports: {
                    select: { id: true, status: true, findings: true, conclusion: true, signed: true, signatureName: true, createdAt: true, author: { select: { id: true, fullName: true } } },
                },
                infoRequests: {
                    orderBy: { createdAt: 'desc' },
                    include: { author: { select: { id: true, fullName: true } } },
                },
            },
        });
        return {
            items: items.map((req) => {
                const approvedReports = req.reports.filter((r) => r.status === 'approved' || r.status === 'final');
                const hasPendingApprovalReport = req.reports.some((r) => r.status === 'pending_approval');
                return {
                    ...req,
                    hasPendingApprovalReport,
                    reports: approvedReports,
                };
            }),
        };
    }
    async telereportDetail(auth, id) {
        const identity = verifyUserToken(auth);
        const item = await this.prisma.teleReportRequest.findFirst({
            where: {
                id,
                OR: [{ userId: identity.id }, { phone: identity.email }],
            },
            include: {
                attachments: true,
                reports: {
                    where: { status: { in: ['approved', 'final'] } },
                    include: { images: true, author: { select: { id: true, fullName: true } } },
                },
                infoRequests: {
                    orderBy: { createdAt: 'desc' },
                    include: { author: { select: { id: true, fullName: true } } },
                },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        return item;
    }
    async replyTelereportInfo(auth, id, body) {
        const identity = verifyUserToken(auth);
        const message = body.message?.trim();
        if (!message)
            throw new common_1.BadRequestException('متن پیام الزامی است');
        const targetInfoRequestId = body.infoRequestId || id;
        const infoRequest = await this.prisma.infoRequest.findFirst({
            where: {
                id: targetInfoRequestId,
                request: {
                    OR: [{ userId: identity.id }, { phone: identity.email }],
                },
            },
        });
        if (!infoRequest)
            throw new common_1.NotFoundException('درخواست اطلاعات تکمیلی یافت نشد');
        const existingMessages = Array.isArray(infoRequest.messages)
            ? infoRequest.messages
            : [];
        const newMsg = {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            senderRole: 'patient',
            senderId: identity.id,
            senderName: identity.name || 'بیمار',
            message,
            createdAt: new Date().toISOString(),
        };
        const updatedMessages = [...existingMessages, newMsg];
        const updated = await this.prisma.infoRequest.update({
            where: { id: infoRequest.id },
            data: {
                messages: updatedMessages,
                response: message,
                respondedAt: new Date(),
                status: 'responded',
            },
        });
        return updated;
    }
    // ── 5. Medical Reports ──
    async medicalReports(auth, search) {
        const identity = verifyUserToken(auth);
        const where = { userId: identity.id };
        if (search?.trim()) {
            where.OR = [
                { title: { contains: search.trim(), mode: 'insensitive' } },
                { type: { contains: search.trim(), mode: 'insensitive' } },
                { description: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }
        const items = await this.prisma.medicalReport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async medicalReportDetail(auth, id) {
        const identity = verifyUserToken(auth);
        const item = await this.prisma.medicalReport.findFirst({
            where: { id, userId: identity.id },
        });
        if (!item)
            throw new common_1.NotFoundException('گزارش یافت نشد');
        return item;
    }
    // ── 6. Transactions & Payments ──
    async transactions(auth) {
        const identity = verifyUserToken(auth);
        const items = await this.prisma.userTransaction.findMany({
            where: { userId: identity.id },
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async transactionDetail(auth, id) {
        const identity = verifyUserToken(auth);
        const item = await this.prisma.userTransaction.findFirst({
            where: { id, userId: identity.id },
        });
        if (!item)
            throw new common_1.NotFoundException('تراکنش یافت نشد');
        return item;
    }
    // ── 7. Notifications ──
    async notifications(auth) {
        const identity = verifyUserToken(auth);
        const items = await this.prisma.userNotification.findMany({
            where: { userId: identity.id },
            orderBy: { createdAt: 'desc' },
        });
        const unreadCount = items.filter((n) => !n.isRead).length;
        return { items, unreadCount };
    }
    async markNotificationRead(auth, id) {
        const identity = verifyUserToken(auth);
        const notif = await this.prisma.userNotification.findFirst({
            where: { id, userId: identity.id },
        });
        if (!notif)
            throw new common_1.NotFoundException('اعلان یافت نشد');
        return this.prisma.userNotification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async markAllNotificationsRead(auth) {
        const identity = verifyUserToken(auth);
        await this.prisma.userNotification.updateMany({
            where: { userId: identity.id, isRead: false },
            data: { isRead: true },
        });
        return { ok: true };
    }
    // ── 8. Support Tickets ──
    async tickets(auth) {
        const identity = verifyUserToken(auth);
        const items = await this.prisma.ticket.findMany({
            where: { userId: identity.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { replies: true } },
                expert: { select: { id: true, fullName: true } },
            },
        });
        return { items };
    }
    async createTicket(auth, dto) {
        const identity = verifyUserToken(auth);
        const ticket = await this.prisma.ticket.create({
            data: {
                subject: dto.subject,
                message: dto.message,
                category: dto.category ?? 'general',
                priority: dto.priority ?? 'medium',
                status: 'open',
                userId: identity.id,
            },
        });
        return ticket;
    }
    async ticketDetail(auth, id) {
        const identity = verifyUserToken(auth);
        const ticket = await this.prisma.ticket.findFirst({
            where: { id, userId: identity.id },
            include: {
                replies: {
                    include: { author: { select: { id: true, fullName: true, role: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                expert: { select: { id: true, fullName: true } },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        return ticket;
    }
    async replyTicket(auth, id, dto) {
        const identity = verifyUserToken(auth);
        const ticket = await this.prisma.ticket.findFirst({
            where: { id, userId: identity.id },
        });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        if (ticket.status === 'closed') {
            throw new common_1.BadRequestException('این تیکت بسته شده است');
        }
        const [reply] = await this.prisma.$transaction([
            this.prisma.ticketReply.create({
                data: { ticketId: id, authorId: identity.id, message: dto.message },
                include: { author: { select: { id: true, fullName: true, role: true } } },
            }),
            this.prisma.ticket.update({
                where: { id },
                data: { status: 'open' },
            }),
        ]);
        return reply;
    }
    // ── 9. Reviews & Feedback ──
    async reviews(auth) {
        const identity = verifyUserToken(auth);
        const items = await this.prisma.review.findMany({
            where: { userId: identity.id },
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async createReview(auth, dto) {
        const identity = verifyUserToken(auth);
        const review = await this.prisma.review.create({
            data: {
                userId: identity.id,
                targetType: dto.targetType,
                targetId: dto.targetId,
                rating: dto.rating,
                content: dto.content,
                status: 'pending',
            },
        });
        return review;
    }
};
exports.PanelController = PanelController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "orders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "orderDetail", null);
__decorate([
    (0, common_1.Get)('telereports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "telereports", null);
__decorate([
    (0, common_1.Get)('telereports/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "telereportDetail", null);
__decorate([
    (0, common_1.Post)('telereports/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "replyTelereportInfo", null);
__decorate([
    (0, common_1.Get)('medical-reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "medicalReports", null);
__decorate([
    (0, common_1.Get)('medical-reports/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "medicalReportDetail", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "transactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "transactionDetail", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "notifications", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/read'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "markNotificationRead", null);
__decorate([
    (0, common_1.Patch)('notifications/read-all'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "tickets", null);
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateTicketDto]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "ticketDetail", null);
__decorate([
    (0, common_1.Post)('tickets/:id/reply'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ReplyTicketDto]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "replyTicket", null);
__decorate([
    (0, common_1.Get)('reviews'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "reviews", null);
__decorate([
    (0, common_1.Post)('reviews'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateReviewDto]),
    __metadata("design:returntype", Promise)
], PanelController.prototype, "createReview", null);
exports.PanelController = PanelController = __decorate([
    (0, common_1.Controller)('panel'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PanelController);
