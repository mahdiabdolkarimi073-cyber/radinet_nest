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
exports.OrgController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const path_1 = require("path");
const multipart_upload_1 = require("./multipart-upload");
const prisma_service_1 = require("./prisma.service");
const auth_token_1 = require("./auth-token");
const tele_report_validation_1 = require("./tele-report-validation");
// ── DTOs ──
class CreateStaffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'نام و نام خانوادگی الزامی است' }),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'فرمت ایمیل معتبر نیست' }),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ORG_STAFF', 'ORG_ADMIN', 'org_staff', 'org_admin']),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['active', 'inactive']),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "status", void 0);
class UpdateStaffDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'نام نمی‌تواند خالی باشد' }),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'فرمت ایمیل معتبر نیست' }),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ORG_STAFF', 'ORG_ADMIN', 'org_staff', 'org_admin']),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['active', 'inactive']),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "status", void 0);
class CreateRequestDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "patientName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "patientFirstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "patientLastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "age", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'نوع خدمت / تصویربرداری الزامی است' }),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "requestType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "imagingArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "studyDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "symptoms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['normal', 'urgent', 'emergency']),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "pacsUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "cloudUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "submittingUserId", void 0);
class UpdateRequestStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['new', 'pending', 'in_progress', 'processing', 'completed', 'rejected', 'cancelled']),
    __metadata("design:type", String)
], UpdateRequestStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateRequestStatusDto.prototype, "note", void 0);
class UpdateOrgDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'نام سازمان نمی‌تواند خالی باشد' }),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "economicCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "logo", void 0);
class UpdateOrgPermissionsDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrgPermissionsDto.prototype, "staffCanSubmit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrgPermissionsDto.prototype, "staffCanViewReports", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrgPermissionsDto.prototype, "staffCanViewAllRequests", void 0);
class RecordInvoicePaymentDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecordInvoicePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['bank_transfer', 'online_gateway', 'cheque', 'credit']),
    __metadata("design:type", String)
], RecordInvoicePaymentDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RecordInvoicePaymentDto.prototype, "reference", void 0);
class RequestQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestQueryDto.prototype, "limit", void 0);
class ReportQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "userId", void 0);
let OrgController = class OrgController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Auth Helpers ──
    async requireOrgUser(authHeader) {
        const payload = (0, auth_token_1.verifyAuthToken)(authHeader);
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            throw new common_1.ForbiddenException('کاربر یافت نشد');
        const normalizedRole = user.role.toLowerCase();
        if (normalizedRole !== 'org_admin' && normalizedRole !== 'org_staff') {
            throw new common_1.ForbiddenException('دسترسی فقط برای اعضای سازمان مجاز است');
        }
        if (user.status !== 'active') {
            throw new common_1.ForbiddenException('حساب کاربری غیرفعال است');
        }
        if (!user.organizationId) {
            let org = await this.prisma.organization.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            if (!org) {
                const slug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                org = await this.prisma.organization.create({
                    data: {
                        name: `سازمان ${user.fullName}`,
                        slug,
                        type: 'company',
                        email: user.email,
                        isActive: true,
                    },
                });
            }
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: { organizationId: org.id },
            });
            return updatedUser;
        }
        return user;
    }
    async requireOrgAdmin(authHeader) {
        const user = await this.requireOrgUser(authHeader);
        if (user.role.toLowerCase() !== 'org_admin') {
            throw new common_1.ForbiddenException('دسترسی فقط برای مدیر سازمان مجاز است');
        }
        return user;
    }
    async getOrgPermissions(orgId) {
        let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
        if (!settings) {
            settings = await this.prisma.orgSettings.create({
                data: {
                    orgId,
                    settings: {
                        staffCanSubmit: true,
                        staffCanViewReports: true,
                        staffCanViewAllRequests: true,
                    },
                },
            });
        }
        const raw = (settings.settings ?? {});
        return {
            staffCanSubmit: raw.staffCanSubmit !== false,
            staffCanViewReports: raw.staffCanViewReports !== false,
            staffCanViewAllRequests: raw.staffCanViewAllRequests !== false,
        };
    }
    // ── 0. Context / Profile ──
    async getContext(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const [org, permissions] = await Promise.all([
            this.prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                    city: true,
                    province: true,
                    logo: true,
                    isActive: true,
                },
            }),
            this.getOrgPermissions(orgId),
        ]);
        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role.toUpperCase(),
                organizationId: orgId,
            },
            organization: org,
            permissions,
        };
    }
    // ── 1. Dashboard ──
    async dashboardStats(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const pendingStatuses = ['new', 'pending', 'in_progress', 'processing', 'reviewing', 'need_info'];
        const completedStatuses = ['completed', 'signed', 'approved', 'delivered', 'referred'];
        const rejectedStatuses = ['rejected', 'cancelled'];
        const [organization, totalRequests, pendingRequests, completedRequests, rejectedRequests, staffCount, activeStaffCount, recentRequests, requestsByType, allInvoices, recentPayments, recentStatusLogs, recentUsers,] = await Promise.all([
            this.prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                    city: true,
                    province: true,
                    phone: true,
                    email: true,
                },
            }),
            this.prisma.teleReportRequest.count({
                where: { user: { organizationId: orgId } },
            }),
            this.prisma.teleReportRequest.count({
                where: {
                    user: { organizationId: orgId },
                    status: { in: pendingStatuses },
                },
            }),
            this.prisma.teleReportRequest.count({
                where: {
                    user: { organizationId: orgId },
                    status: { in: completedStatuses },
                },
            }),
            this.prisma.teleReportRequest.count({
                where: {
                    user: { organizationId: orgId },
                    status: { in: rejectedStatuses },
                },
            }),
            this.prisma.user.count({
                where: { organizationId: orgId },
            }),
            this.prisma.user.count({
                where: { organizationId: orgId, status: 'active' },
            }),
            this.prisma.teleReportRequest.findMany({
                where: { user: { organizationId: orgId } },
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: {
                    id: true,
                    requestNumber: true,
                    patientFirstName: true,
                    patientLastName: true,
                    phone: true,
                    imagingType: true,
                    imagingArea: true,
                    status: true,
                    createdAt: true,
                    user: { select: { id: true, fullName: true, email: true } },
                },
            }),
            this.prisma.teleReportRequest.groupBy({
                by: ['imagingType'],
                where: { user: { organizationId: orgId } },
                _count: { id: true },
            }),
            this.prisma.orgInvoice.findMany({
                where: {
                    OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
                },
                include: {
                    payments: true,
                    contract: { select: { id: true, contractNumber: true, title: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.orgPayment.findMany({
                where: {
                    invoice: {
                        OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
                    },
                },
                include: {
                    invoice: { select: { id: true, invoiceNumber: true } },
                },
                orderBy: { paidAt: 'desc' },
                take: 5,
            }),
            this.prisma.orgRequestStatusLog.findMany({
                where: {
                    user: { organizationId: orgId },
                },
                include: {
                    user: { select: { id: true, fullName: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 6,
            }),
            this.prisma.user.findMany({
                where: { organizationId: orgId },
                orderBy: { createdAt: 'desc' },
                take: 4,
                select: { id: true, fullName: true, role: true, createdAt: true },
            }),
        ]);
        // Calculate financial totals from real DB records
        let totalInvoicedAmount = 0;
        let totalPaidAmount = 0;
        let remainingDebtAmount = 0;
        let pendingInvoices = 0;
        let paidInvoicesCount = 0;
        let overdueInvoicesCount = 0;
        const formattedInvoices = allInvoices.map((inv) => {
            const invAmount = Number(inv.amount ?? 0);
            const paymentsSum = inv.payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
            const effectivePaid = inv.status === 'paid' && paymentsSum === 0 ? invAmount : Math.min(invAmount, paymentsSum);
            const remaining = inv.status === 'paid' ? 0 : Math.max(0, invAmount - effectivePaid);
            totalInvoicedAmount += invAmount;
            totalPaidAmount += effectivePaid;
            remainingDebtAmount += remaining;
            if (inv.status === 'paid') {
                paidInvoicesCount += 1;
            }
            else {
                pendingInvoices += 1;
                if (inv.status === 'overdue')
                    overdueInvoicesCount += 1;
            }
            return {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                amount: String(invAmount),
                paidAmount: String(effectivePaid),
                remainingAmount: String(remaining),
                dueDate: inv.dueDate,
                status: inv.status,
                createdAt: inv.createdAt,
                contract: inv.contract,
            };
        });
        // Monthly request counts (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentAll = await this.prisma.teleReportRequest.findMany({
            where: {
                user: { organizationId: orgId },
                createdAt: { gte: sixMonthsAgo },
            },
            select: { createdAt: true },
        });
        const monthlyMap = {};
        for (const r of recentAll) {
            const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[key] = (monthlyMap[key] || 0) + 1;
        }
        const monthlyData = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
        // Build combined recent organization activities
        const activities = [];
        for (const log of recentStatusLogs) {
            activities.push({
                id: `log-${log.id}`,
                type: 'request_log',
                title: log.status === 'new' ? 'ثبت درخواست تله‌ریپورت' : `تغییر وضعیت درخواست (${log.status})`,
                description: log.note || 'به‌روزرسانی وضعیت درخواست در سامانه',
                actor: log.user?.fullName ?? 'کاربر سازمان',
                createdAt: log.createdAt,
            });
        }
        for (const pay of recentPayments) {
            activities.push({
                id: `pay-${pay.id}`,
                type: 'payment',
                title: `ثبت پرداخت صورت‌حساب ${pay.invoice.invoiceNumber}`,
                description: `مبلغ ${Number(pay.amount).toLocaleString('fa-IR')} ریال (${pay.reference || pay.method})`,
                actor: 'امور مالی سازمان',
                createdAt: pay.paidAt,
            });
        }
        for (const u of recentUsers) {
            activities.push({
                id: `usr-${u.id}`,
                type: 'user',
                title: 'عضویت کاربر در سازمان',
                description: `${u.fullName} (${u.role.toLowerCase() === 'org_admin' ? 'مدیر سازمان' : 'کارشناس سازمان'})`,
                actor: u.fullName,
                createdAt: u.createdAt,
            });
        }
        activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return {
            organization,
            totalRequests,
            pendingRequests,
            completedRequests,
            rejectedRequests,
            staffCount,
            activeStaffCount,
            pendingInvoices,
            totalInvoicesCount: allInvoices.length,
            paidInvoicesCount,
            overdueInvoicesCount,
            totalInvoicedAmount: String(totalInvoicedAmount),
            totalPaidAmount: String(totalPaidAmount),
            remainingDebtAmount: String(remainingDebtAmount),
            recentInvoices: formattedInvoices.slice(0, 5),
            recentRequests,
            recentActivities: activities.slice(0, 8),
            requestsByType: requestsByType.map((g) => ({
                name: g.imagingType || 'سایر',
                count: g._count.id,
            })),
            monthlyData,
        };
    }
    // ── 2. Organization Users Management ──
    async listUsers(auth, search, status, role) {
        // Allow ORG_ADMIN full management, and ORG_STAFF read-only list for selecting users in forms
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const where = {
            organizationId: orgId,
        };
        if (status && (status === 'active' || status === 'inactive')) {
            where.status = status;
        }
        if (role) {
            const normalized = role.toLowerCase();
            if (normalized === 'org_admin') {
                where.role = { in: ['ORG_ADMIN', 'org_admin'] };
            }
            else if (normalized === 'org_staff') {
                where.role = { in: ['ORG_STAFF', 'org_staff'] };
            }
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
            ];
        }
        const users = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        teleReportRequests: true,
                    },
                },
            },
        });
        return users.map((u) => ({
            ...u,
            role: u.role.toUpperCase(),
            requestsCount: u._count.teleReportRequests,
        }));
    }
    async createUser(auth, dto) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        const email = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('این ایمیل قبلاً در سامانه ثبت شده است');
        }
        const requestedRole = (dto.role ?? 'ORG_STAFF').toUpperCase();
        const allowedRole = requestedRole === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'ORG_STAFF';
        const allowedStatus = dto.status === 'inactive' ? 'inactive' : 'active';
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const created = await this.prisma.user.create({
            data: {
                fullName: dto.fullName.trim(),
                email,
                passwordHash,
                role: allowedRole,
                status: allowedStatus,
                organizationId: orgId,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        return {
            ...created,
            role: created.role.toUpperCase(),
            requestsCount: 0,
        };
    }
    async updateUser(auth, id, dto) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.organizationId !== orgId) {
            throw new common_1.NotFoundException('کاربر در سازمان شما یافت نشد');
        }
        const data = {};
        if (dto.fullName !== undefined) {
            if (!dto.fullName.trim())
                throw new common_1.BadRequestException('نام کاربر نمی‌تواند خالی باشد');
            data.fullName = dto.fullName.trim();
        }
        if (dto.email !== undefined) {
            const email = dto.email.trim().toLowerCase();
            if (email !== target.email) {
                const dup = await this.prisma.user.findUnique({ where: { email } });
                if (dup)
                    throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
                data.email = email;
            }
        }
        if (dto.status !== undefined) {
            if (id === admin.id && dto.status === 'inactive') {
                throw new common_1.BadRequestException('نمی‌توانید حساب کاربری خودتان را غیرفعال کنید');
            }
            data.status = dto.status;
        }
        if (dto.role !== undefined) {
            const normalized = dto.role.toUpperCase();
            if (id === admin.id && normalized !== 'ORG_ADMIN') {
                throw new common_1.BadRequestException('نمی‌توانید نقش مدیریت سازمان را از حساب خودتان سلب کنید');
            }
            data.role = normalized === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'ORG_STAFF';
        }
        if (dto.password) {
            data.passwordHash = await bcrypt.hash(dto.password, 12);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                _count: { select: { teleReportRequests: true } },
            },
        });
        return {
            ...updated,
            role: updated.role.toUpperCase(),
            requestsCount: updated._count.teleReportRequests,
        };
    }
    async deleteUser(auth, id) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.organizationId !== orgId) {
            throw new common_1.NotFoundException('کاربر در سازمان شما یافت نشد');
        }
        if (id === admin.id) {
            throw new common_1.BadRequestException('نمی‌توانید حساب کاربری خودتان را حذف کنید');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.teleReportRequest.updateMany({
                where: { userId: id },
                data: { userId: admin.id },
            });
            await tx.orgRequestStatusLog.updateMany({
                where: { createdBy: id },
                data: { createdBy: admin.id },
            });
            await tx.radiologyReport.updateMany({
                where: { authorId: id },
                data: { authorId: null },
            });
            await tx.infoRequest.updateMany({
                where: { authorId: id },
                data: { authorId: null },
            });
            await tx.shopOrder.updateMany({
                where: { userId: id },
                data: { userId: null },
            });
            await tx.telereportNotification.updateMany({
                where: { sentBy: id },
                data: { sentBy: null },
            });
            await tx.user.delete({ where: { id } });
        });
        return { ok: true };
    }
    // ── 3 & 4. Tele-Report Requests (Create, List, Detail, Status Update) ──
    async listRequests(auth, query) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const perms = await this.getOrgPermissions(orgId);
        const page = query.page ?? 1;
        const limit = query.limit ?? 15;
        const skip = (page - 1) * limit;
        const where = {
            user: { organizationId: orgId },
        };
        // If ORG_STAFF and staffCanViewAllRequests is false, scope to their own requests
        if (user.role.toLowerCase() === 'org_staff' && !perms.staffCanViewAllRequests) {
            where.userId = user.id;
        }
        else if (query.userId) {
            // Verify that the filtered userId belongs to the same organization
            const targetUser = await this.prisma.user.findUnique({ where: { id: query.userId } });
            if (targetUser && targetUser.organizationId === orgId) {
                where.userId = query.userId;
            }
            else {
                where.userId = '00000000-0000-0000-0000-000000000000';
            }
        }
        if (query.status) {
            if (query.status === 'pending_group') {
                where.status = { in: ['new', 'pending', 'in_progress', 'processing', 'reviewing'] };
            }
            else {
                where.status = query.status;
            }
        }
        if (query.type) {
            where.imagingType = query.type;
        }
        if (query.startDate || query.endDate) {
            const createdAt = {};
            if (query.startDate)
                createdAt.gte = new Date(query.startDate);
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setHours(23, 59, 59, 999);
                createdAt.lte = end;
            }
            where.createdAt = createdAt;
        }
        if (query.search && query.search.trim()) {
            const q = query.search.trim();
            where.OR = [
                { requestNumber: { contains: q, mode: 'insensitive' } },
                { patientFirstName: { contains: q, mode: 'insensitive' } },
                { patientLastName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { nationalId: { contains: q, mode: 'insensitive' } },
                { imagingType: { contains: q, mode: 'insensitive' } },
                { imagingArea: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.teleReportRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    requestNumber: true,
                    patientFirstName: true,
                    patientLastName: true,
                    nationalId: true,
                    phone: true,
                    city: true,
                    age: true,
                    gender: true,
                    imagingType: true,
                    imagingArea: true,
                    clinicalHistory: true,
                    symptoms: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    user: { select: { id: true, fullName: true, email: true, role: true } },
                    _count: { select: { attachments: true, reports: true } },
                },
            }),
            this.prisma.teleReportRequest.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }
    async createRequest(auth, dto, files = []) {
        try {
            const user = await this.requireOrgUser(auth);
            const orgId = user.organizationId;
            if (user.role.toLowerCase() === 'org_staff') {
                const perms = await this.getOrgPermissions(orgId);
                if (!perms.staffCanSubmit) {
                    throw new common_1.ForbiddenException('دسترسی ثبت درخواست برای کارشناسان سازمان غیرفعال است');
                }
            }
            // Determine which organization user this request is associated with
            let targetUserId = user.id;
            if (dto.submittingUserId && dto.submittingUserId !== user.id) {
                const subUser = await this.prisma.user.findUnique({
                    where: { id: dto.submittingUserId },
                });
                if (!subUser || subUser.organizationId !== orgId) {
                    throw new common_1.BadRequestException('کاربر انتخاب‌شده متعلق به این سازمان نیست');
                }
                targetUserId = subUser.id;
            }
            // Parse patient first/last name
            let firstName = (dto.patientFirstName ?? '').trim();
            let lastName = (dto.patientLastName ?? '').trim();
            if (!firstName && dto.patientName) {
                const nameParts = dto.patientName.trim().split(/\s+/);
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            }
            if (!firstName) {
                throw new common_1.BadRequestException('نام بیمار الزامی است');
            }
            const validatedAge = (0, tele_report_validation_1.parseValidatedAge)(dto.age, { required: false });
            const validatedStudyDate = (0, tele_report_validation_1.parseOptionalValidDate)(dto.studyDate, 'تاریخ تصویربرداری');
            const org = await this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { city: true, phone: true },
            });
            const priorityLabel = dto.priority === 'emergency'
                ? 'اورژانسی'
                : dto.priority === 'urgent'
                    ? 'فوری'
                    : 'عادی';
            const requestNumber = `ORG-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2).toString('hex').toUpperCase()}`;
            const clinicalHistoryText = [
                dto.priority && dto.priority !== 'normal' ? `[اولویت: ${priorityLabel}]` : '',
                (dto.description ?? '').trim(),
            ]
                .filter(Boolean)
                .join(' — ');
            // Save uploaded attachments metadata if any (files already written to disk by MultipartUploadInterceptor)
            const attachmentRecords = files.map((file) => ({
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype || 'application/octet-stream',
                size: file.size,
                storagePath: `/uploads/tele-reports/${file.filename}`,
            }));
            const request = await this.prisma.teleReportRequest.create({
                data: {
                    requestNumber,
                    userId: targetUserId,
                    country: 'IR',
                    language: 'fa',
                    patientFirstName: firstName,
                    patientLastName: lastName,
                    nationalId: dto.nationalId?.trim() || null,
                    phone: dto.phone?.trim() || org?.phone || '',
                    city: dto.city?.trim() || org?.city || 'تهران',
                    age: validatedAge,
                    gender: dto.gender?.trim() || 'unknown',
                    clinicalHistory: clinicalHistoryText,
                    symptoms: (dto.symptoms ?? '').trim(),
                    imagingType: dto.requestType.trim(),
                    imagingArea: (dto.imagingArea ?? '').trim() || 'عمومی',
                    studyDate: validatedStudyDate,
                    pacsUrl: dto.pacsUrl?.trim() || null,
                    cloudUrl: dto.cloudUrl?.trim() || null,
                    status: 'new',
                    attachments: attachmentRecords.length > 0
                        ? {
                            create: attachmentRecords,
                        }
                        : undefined,
                },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    attachments: true,
                },
            });
            await this.prisma.orgRequestStatusLog.create({
                data: {
                    requestId: request.id,
                    status: 'new',
                    note: targetUserId !== user.id
                        ? `درخواست توسط ${user.fullName} برای کاربر زیرمجموعه (${request.user?.fullName ?? ''}) ثبت شد — اولویت: ${priorityLabel}`
                        : `درخواست تله‌ریپورت ثبت شد — اولویت: ${priorityLabel}`,
                    createdBy: user.id,
                },
            });
            return request;
        }
        catch (error) {
            await (0, tele_report_validation_1.cleanupUploadedFiles)(files);
            throw error;
        }
    }
    async getRequest(auth, id) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, fullName: true, email: true, role: true, organizationId: true } },
                attachments: true,
                reports: {
                    include: {
                        author: { select: { fullName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                infoRequests: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!request || request.user?.organizationId !== orgId) {
            throw new common_1.NotFoundException('درخواست در سازمان شما یافت نشد');
        }
        const statusLogs = await this.prisma.orgRequestStatusLog.findMany({
            where: { requestId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { fullName: true, role: true } },
            },
        });
        return { ...request, statusLogs };
    }
    async updateRequestStatus(auth, id, dto) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { id },
            include: { user: { select: { organizationId: true } } },
        });
        if (!request || request.user?.organizationId !== orgId) {
            throw new common_1.NotFoundException('درخواست در سازمان شما یافت نشد');
        }
        const updated = await this.prisma.teleReportRequest.update({
            where: { id },
            data: { status: dto.status },
        });
        const log = await this.prisma.orgRequestStatusLog.create({
            data: {
                requestId: id,
                status: dto.status,
                note: (dto.note ?? '').trim() || `وضعیت درخواست به «${dto.status}» تغییر یافت`,
                createdBy: user.id,
            },
            include: {
                user: { select: { fullName: true, role: true } },
            },
        });
        return { request: updated, log };
    }
    // ── 5. Reports ──
    async getReports(auth, query) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        if (user.role.toLowerCase() === 'org_staff') {
            const perms = await this.getOrgPermissions(orgId);
            if (!perms.staffCanViewReports) {
                throw new common_1.ForbiddenException('دسترسی مشاهده گزارش‌ها برای کارشناسان سازمان غیرفعال است');
            }
        }
        const where = {
            user: { organizationId: orgId },
        };
        if (query.status) {
            where.status = query.status;
        }
        if (query.type) {
            where.imagingType = query.type;
        }
        if (query.userId) {
            const targetUser = await this.prisma.user.findUnique({ where: { id: query.userId } });
            if (targetUser && targetUser.organizationId === orgId) {
                where.userId = query.userId;
            }
            else {
                where.userId = '00000000-0000-0000-0000-000000000000';
            }
        }
        if (query.startDate || query.endDate) {
            const createdAt = {};
            if (query.startDate)
                createdAt.gte = new Date(query.startDate);
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setHours(23, 59, 59, 999);
                createdAt.lte = end;
            }
            where.createdAt = createdAt;
        }
        const [requests, orgUsers] = await Promise.all([
            this.prisma.teleReportRequest.findMany({
                where,
                select: {
                    id: true,
                    imagingType: true,
                    imagingArea: true,
                    status: true,
                    createdAt: true,
                    user: { select: { id: true, fullName: true, role: true } },
                },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.user.findMany({
                where: { organizationId: orgId },
                select: { id: true, fullName: true, role: true },
                orderBy: { fullName: 'asc' },
            }),
        ]);
        const completedSet = new Set(['completed', 'signed', 'approved', 'delivered', 'referred']);
        const rejectedSet = new Set(['rejected', 'cancelled']);
        // Summary stats
        let completedCount = 0;
        let rejectedCount = 0;
        let pendingCount = 0;
        // By User (with performance breakdown)
        const userMap = {};
        for (const u of orgUsers) {
            userMap[u.id] = {
                userId: u.id,
                name: u.fullName,
                role: u.role.toUpperCase(),
                count: 0,
                completed: 0,
                pending: 0,
                rejected: 0,
            };
        }
        const typeMap = {};
        const statusMap = {};
        const dateMap = {};
        for (const r of requests) {
            const isCompleted = completedSet.has(r.status);
            const isRejected = rejectedSet.has(r.status);
            if (isCompleted)
                completedCount += 1;
            else if (isRejected)
                rejectedCount += 1;
            else
                pendingCount += 1;
            const uKey = r.user?.id || 'unknown';
            if (!userMap[uKey]) {
                userMap[uKey] = {
                    userId: uKey,
                    name: r.user?.fullName || 'نامشخص',
                    role: r.user?.role?.toUpperCase() || 'ORG_STAFF',
                    count: 0,
                    completed: 0,
                    pending: 0,
                    rejected: 0,
                };
            }
            userMap[uKey].count += 1;
            if (isCompleted)
                userMap[uKey].completed += 1;
            else if (isRejected)
                userMap[uKey].rejected += 1;
            else
                userMap[uKey].pending += 1;
            const tName = r.imagingType || 'سایر';
            typeMap[tName] = (typeMap[tName] || 0) + 1;
            const sName = r.status || 'new';
            statusMap[sName] = (statusMap[sName] || 0) + 1;
            const dKey = r.createdAt.toISOString().slice(0, 10);
            dateMap[dKey] = (dateMap[dKey] || 0) + 1;
        }
        const totalCount = requests.length;
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        return {
            summary: {
                total: totalCount,
                completed: completedCount,
                pending: pendingCount,
                rejected: rejectedCount,
                completionRate,
            },
            byUser: Object.values(userMap).sort((a, b) => b.count - a.count),
            byType: Object.entries(typeMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            byStatus: Object.entries(statusMap)
                .map(([status, count]) => ({ status, count }))
                .sort((a, b) => b.count - a.count),
            byDate: Object.entries(dateMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => ({ date, count })),
        };
    }
    // ── 6. Contracts, Invoices & Payments ──
    async listContracts(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const contracts = await this.prisma.organizationContract.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: {
                center: { select: { id: true, name: true, city: true, phone: true } },
                invoices: {
                    include: { payments: true },
                },
                _count: { select: { invoices: true } },
            },
        });
        return contracts.map((c) => {
            const totalInvoiced = c.invoices.reduce((s, inv) => s + Number(inv.amount ?? 0), 0);
            const totalPaid = c.invoices.reduce((s, inv) => {
                const invAmt = Number(inv.amount ?? 0);
                const pSum = inv.payments.reduce((ps, p) => ps + Number(p.amount ?? 0), 0);
                return s + (inv.status === 'paid' && pSum === 0 ? invAmt : Math.min(invAmt, pSum));
            }, 0);
            return {
                id: c.id,
                contractNumber: c.contractNumber,
                title: c.title,
                type: c.type,
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate,
                terms: c.terms,
                discountPercent: c.discountPercent,
                creditLimit: c.creditLimit ? String(c.creditLimit) : null,
                signedBy: c.signedBy,
                signedAt: c.signedAt,
                notes: c.notes,
                center: c.center,
                _count: c._count,
                totalInvoiced: String(totalInvoiced),
                totalPaid: String(totalPaid),
                createdAt: c.createdAt,
            };
        });
    }
    async listInvoices(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const invoices = await this.prisma.orgInvoice.findMany({
            where: {
                OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                contract: { select: { id: true, contractNumber: true, title: true } },
                payments: {
                    orderBy: { paidAt: 'desc' },
                },
                _count: { select: { payments: true } },
            },
        });
        return invoices.map((inv) => {
            const invAmount = Number(inv.amount ?? 0);
            const paidSum = inv.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
            const effectivePaid = inv.status === 'paid' && paidSum === 0 ? invAmount : Math.min(invAmount, paidSum);
            const remaining = inv.status === 'paid' ? 0 : Math.max(0, invAmount - effectivePaid);
            return {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                amount: String(invAmount),
                paidAmount: String(effectivePaid),
                remainingAmount: String(remaining),
                dueDate: inv.dueDate,
                status: inv.status,
                createdAt: inv.createdAt,
                contract: inv.contract,
                payments: inv.payments.map((p) => ({
                    id: p.id,
                    amount: String(p.amount),
                    paidAt: p.paidAt,
                    method: p.method,
                    reference: p.reference,
                })),
                _count: inv._count,
            };
        });
    }
    async listPayments(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const payments = await this.prisma.orgPayment.findMany({
            where: {
                invoice: {
                    OR: [{ organizationId: orgId }, { contract: { organizationId: orgId } }],
                },
            },
            orderBy: { paidAt: 'desc' },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        amount: true,
                        status: true,
                        contract: { select: { id: true, contractNumber: true, title: true } },
                    },
                },
            },
        });
        return payments.map((p) => ({
            ...p,
            amount: String(p.amount),
        }));
    }
    async payInvoice(auth, id, dto) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        const invoice = await this.prisma.orgInvoice.findUnique({
            where: { id },
            include: {
                contract: { select: { organizationId: true } },
                payments: true,
            },
        });
        if (!invoice ||
            (invoice.organizationId !== orgId && invoice.contract?.organizationId !== orgId)) {
            throw new common_1.NotFoundException('صورت‌حساب در سازمان شما یافت نشد');
        }
        if (invoice.status === 'paid') {
            throw new common_1.BadRequestException('این صورت‌حساب قبلاً به‌طور کامل پرداخت شده است');
        }
        const totalInvoiceAmount = Number(invoice.amount ?? 0);
        const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
        const remaining = Math.max(0, totalInvoiceAmount - alreadyPaid);
        const paymentAmount = dto.amount !== undefined && dto.amount > 0 ? Math.min(dto.amount, remaining) : remaining;
        if (paymentAmount <= 0) {
            throw new common_1.BadRequestException('مبلغ قابل پرداخت معتبر نیست');
        }
        const method = dto.method || 'online_gateway';
        const reference = dto.reference?.trim() ||
            `PAY-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomBytes)(2).toString('hex').toUpperCase()}`;
        const newPaidTotal = alreadyPaid + paymentAmount;
        const isFullyPaid = newPaidTotal >= totalInvoiceAmount;
        const [payment, updatedInvoice] = await this.prisma.$transaction([
            this.prisma.orgPayment.create({
                data: {
                    invoiceId: invoice.id,
                    amount: paymentAmount,
                    paidAt: new Date(),
                    method,
                    reference,
                },
            }),
            this.prisma.orgInvoice.update({
                where: { id: invoice.id },
                data: {
                    status: isFullyPaid ? 'paid' : invoice.status,
                },
            }),
        ]);
        return {
            payment: {
                ...payment,
                amount: String(payment.amount),
            },
            invoice: {
                ...updatedInvoice,
                amount: String(updatedInvoice.amount),
            },
        };
    }
    // ── 7. Settings ──
    async getSettings(auth) {
        const user = await this.requireOrgUser(auth);
        const orgId = user.organizationId;
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                nationalId: true,
                economicCode: true,
                registrationNumber: true,
                email: true,
                phone: true,
                province: true,
                city: true,
                address: true,
                contactPerson: true,
                contactPhone: true,
                contactEmail: true,
                description: true,
                logo: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
        if (!settings) {
            settings = await this.prisma.orgSettings.create({
                data: {
                    orgId,
                    settings: {
                        staffCanSubmit: true,
                        staffCanViewReports: true,
                        staffCanViewAllRequests: true,
                    },
                },
            });
        }
        return { org, settings };
    }
    async updateSettings(auth, dto) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        const data = {};
        if (dto.name !== undefined) {
            if (!dto.name.trim())
                throw new common_1.BadRequestException('نام سازمان نمی‌تواند خالی باشد');
            data.name = dto.name.trim();
        }
        if (dto.type !== undefined)
            data.type = dto.type.trim() || 'company';
        if (dto.nationalId !== undefined)
            data.nationalId = dto.nationalId.trim() || null;
        if (dto.economicCode !== undefined)
            data.economicCode = dto.economicCode.trim() || null;
        if (dto.registrationNumber !== undefined)
            data.registrationNumber = dto.registrationNumber.trim() || null;
        if (dto.email !== undefined)
            data.email = dto.email.trim();
        if (dto.phone !== undefined)
            data.phone = dto.phone.trim();
        if (dto.province !== undefined)
            data.province = dto.province.trim();
        if (dto.city !== undefined)
            data.city = dto.city.trim();
        if (dto.address !== undefined)
            data.address = dto.address.trim();
        if (dto.contactPerson !== undefined)
            data.contactPerson = dto.contactPerson.trim() || null;
        if (dto.contactPhone !== undefined)
            data.contactPhone = dto.contactPhone.trim() || null;
        if (dto.contactEmail !== undefined)
            data.contactEmail = dto.contactEmail.trim() || null;
        if (dto.description !== undefined)
            data.description = dto.description.trim();
        if (dto.logo !== undefined)
            data.logo = dto.logo.trim() || null;
        const updated = await this.prisma.organization.update({
            where: { id: orgId },
            data,
        });
        return updated;
    }
    async updatePermissions(auth, dto) {
        const admin = await this.requireOrgAdmin(auth);
        const orgId = admin.organizationId;
        let existing = await this.prisma.orgSettings.findUnique({ where: { orgId } });
        const currentSettings = existing?.settings ?? {
            staffCanSubmit: true,
            staffCanViewReports: true,
            staffCanViewAllRequests: true,
        };
        const newSettings = {
            ...currentSettings,
            ...(dto.staffCanSubmit !== undefined ? { staffCanSubmit: dto.staffCanSubmit } : {}),
            ...(dto.staffCanViewReports !== undefined
                ? { staffCanViewReports: dto.staffCanViewReports }
                : {}),
            ...(dto.staffCanViewAllRequests !== undefined
                ? { staffCanViewAllRequests: dto.staffCanViewAllRequests }
                : {}),
        };
        if (existing) {
            existing = await this.prisma.orgSettings.update({
                where: { orgId },
                data: { settings: newSettings },
            });
        }
        else {
            existing = await this.prisma.orgSettings.create({
                data: { orgId, settings: newSettings },
            });
        }
        return existing;
    }
};
exports.OrgController = OrgController;
__decorate([
    (0, common_1.Get)('context'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getContext", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "dashboardStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateStaffDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RequestQueryDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, common_1.UseInterceptors)(new multipart_upload_1.MultipartUploadInterceptor({
        fieldName: 'attachments',
        destination: (0, path_1.join)(process.cwd(), 'uploads', 'tele-reports'),
        maxFiles: 5,
        maxFileSize: 20 * 1024 * 1024,
    })),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, multipart_upload_1.UploadedMultipartFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateRequestDto, Array]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Post)('requests/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateRequestStatusDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateRequestStatus", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('contracts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listContracts", null);
__decorate([
    (0, common_1.Get)('contracts/invoices'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('contracts/payments'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)('contracts/invoices/:id/pay'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, RecordInvoicePaymentDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "payInvoice", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrgDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Put)('settings/permissions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrgPermissionsDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updatePermissions", null);
exports.OrgController = OrgController = __decorate([
    (0, common_1.Controller)('org'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrgController);
