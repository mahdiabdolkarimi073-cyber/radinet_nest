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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const auth_log_service_1 = require("./auth-log.service");
const radinet_logger_1 = require("./radinet-logger");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
const TOKEN_TTL = '7d';
const ALLOWED_LOGIN_ROLES = new Set([
    'admin',
    'radiologist',
    'doctor',
    'support_expert',
    'SUPPORT_EXPERT',
    'SUPPORT_ADMIN',
    'SUPPORT_AGENT',
    'ORG_ADMIN',
    'ORG_STAFF',
    'RADIANT_AGENCY',
    'AGENCY_MANAGER',
    'user',
    'patient',
]);
const ALLOWED_SELF_REGISTER_ROLES = new Set(['patient', 'user']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function normalizeDigits(input) {
    return input
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}
function signToken(user) {
    return jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.fullName,
        fullName: user.fullName,
        ...(user.organizationId ? { organizationId: user.organizationId } : {}),
    }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
function validateRegisterInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return {
            valid: false,
            errors: ['ساختار داده‌های ارسالی برای ثبت‌نام نامعتبر است.'],
        };
    }
    const rawFullName = typeof body.fullName === 'string' && body.fullName.trim()
        ? body.fullName.trim()
        : typeof body.name === 'string' && body.name.trim()
            ? body.name.trim()
            : '';
    const fullName = rawFullName || 'کاربر رادینت';
    if (fullName.length < 2) {
        errors.push('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.');
    }
    const rawEmail = typeof body.email === 'string' ? normalizeDigits(body.email).trim().toLowerCase() : '';
    if (!rawEmail) {
        errors.push('وارد کردن ایمیل الزامی است.');
    }
    else if (!EMAIL_REGEX.test(rawEmail)) {
        errors.push('فرمت ایمیل واردشده معتبر نیست (مثال: user@example.com).');
    }
    const rawPassword = typeof body.password === 'string' ? normalizeDigits(body.password) : '';
    if (!rawPassword) {
        errors.push('وارد کردن رمز عبور الزامی است.');
    }
    else if (rawPassword.length < 6) {
        errors.push('رمز عبور باید حداقل ۶ کاراکتر باشد.');
    }
    if (typeof body.confirmPassword === 'string' &&
        body.confirmPassword.length > 0 &&
        normalizeDigits(body.confirmPassword) !== rawPassword) {
        errors.push('رمز عبور و تکرار آن یکسان نیستند.');
    }
    // ثبت‌نام عمومی در سامانه منحصراً برای نقش بیمار (patient) است و نقش سمت سرور بدون توجه به ورودی کلاینت تعیین می‌شود
    const role = 'patient';
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    return {
        valid: true,
        errors: [],
        data: {
            fullName,
            email: rawEmail,
            password: rawPassword,
            role,
        },
    };
}
function validateLoginInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return {
            valid: false,
            errors: ['ساختار داده‌های ارسالی برای ورود نامعتبر است.'],
        };
    }
    const rawEmail = typeof body.email === 'string' ? normalizeDigits(body.email).trim().toLowerCase() : '';
    if (!rawEmail) {
        errors.push('وارد کردن ایمیل الزامی است.');
    }
    else if (!EMAIL_REGEX.test(rawEmail)) {
        errors.push('فرمت ایمیل واردشده معتبر نیست.');
    }
    const rawPassword = typeof body.password === 'string' ? normalizeDigits(body.password) : '';
    if (!rawPassword) {
        errors.push('وارد کردن رمز عبور الزامی است.');
    }
    else if (rawPassword.length < 4) {
        errors.push('رمز عبور واردشده معتبر نیست.');
    }
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    return {
        valid: true,
        errors: [],
        data: {
            email: rawEmail,
            password: rawPassword,
        },
    };
}
function classifyDatabaseError(err) {
    const errObj = err;
    const code = typeof errObj?.code === 'string' ? errObj.code : errObj?.name || 'DB_ERROR';
    const rawMessage = typeof errObj?.message === 'string' ? errObj.message : 'Unknown database error';
    if (code === 'P2002') {
        return {
            code: 'P2002',
            userMessage: 'این ایمیل قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.',
            technicalSummary: 'Unique constraint violation on users.email (P2002)',
            statusCode: common_1.HttpStatus.CONFLICT,
        };
    }
    if (code === 'P2021' || rawMessage.includes('does not exist in the current database')) {
        return {
            code: 'P2021',
            userMessage: 'جداول دیتابیس در سرور بک‌اند هنوز ایجاد یا همگام‌سازی نشده‌اند (کد P2021). لطفاً دستور npx prisma db push را در بک‌اند اجرا کنید.',
            technicalSummary: `Database table missing (P2021): ${rawMessage.slice(0, 200)}`,
            statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        };
    }
    if (code === 'P1000' ||
        code === 'P1001' ||
        code === 'P1002' ||
        code === 'P1003' ||
        rawMessage.includes("Can't reach database server") ||
        rawMessage.includes('Connection refused') ||
        rawMessage.includes('PrismaClientInitializationError')) {
        return {
            code,
            userMessage: 'ارتباط بک‌اند با دیتابیس PostgreSQL برقرار نیست. لطفاً متغیر DATABASE_URL و وضعیت سرویس PostgreSQL را بررسی کنید.',
            technicalSummary: `Database connection error (${code}): ${rawMessage.slice(0, 200)}`,
            statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        };
    }
    return {
        code,
        userMessage: 'خطای داخلی در پردازش اطلاعات دیتابیس رخ داد. لطفاً جزئیات را در پنل لاگ بررسی کنید.',
        technicalSummary: `${code}: ${rawMessage.slice(0, 250)}`,
        statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
    };
}
let AuthController = class AuthController {
    constructor(prisma, authLogService) {
        this.prisma = prisma;
        this.authLogService = authLogService;
    }
    async health(incomingRequestId, res) {
        const startedAt = new Date();
        const startMs = Date.now();
        const requestId = incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Backend-Reached', 'true');
        const dbHealth = await this.authLogService.checkDatabaseHealth();
        const durationMs = Date.now() - startMs;
        const statusCode = dbHealth.databaseConnected ? common_1.HttpStatus.OK : common_1.HttpStatus.SERVICE_UNAVAILABLE;
        res.status(statusCode);
        await this.authLogService.recordLog({
            requestId,
            source: 'backend',
            level: dbHealth.databaseConnected ? 'INFO' : 'ERROR',
            operation: 'HEALTH_CHECK',
            method: 'GET',
            routePath: '/api/auth/health',
            targetUrl: '/api/auth/health',
            statusCode,
            durationMs,
            backendReached: true,
            dtoValidationPassed: true,
            operationResult: dbHealth.databaseConnected ? 'SUCCESS' : 'FAILED',
            connectionStatus: dbHealth.databaseConnected ? 'CONNECTED' : 'DB_OFFLINE',
            failureStage: dbHealth.databaseConnected ? 'NONE' : 'BACKEND_DATABASE',
            errorCategory: dbHealth.databaseConnected ? 'NONE' : 'DATABASE',
            errorMessage: dbHealth.dbError,
            metadata: {
                databaseConnected: dbHealth.databaseConnected,
                usersTableReady: dbHealth.usersTableReady,
                logsTableReady: dbHealth.logsTableReady,
                userCount: dbHealth.userCount,
            },
            startedAt,
            completedAt: new Date(),
        });
        return {
            ok: dbHealth.databaseConnected,
            statusCode,
            requestId,
            backendReached: true,
            durationMs,
            ...dbHealth,
            timestamp: new Date().toISOString(),
        };
    }
    async register(body, incomingRequestId, res) {
        const startedAt = new Date();
        const startMs = Date.now();
        const requestId = incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Backend-Reached', 'true');
        const rawEmailForMask = typeof body?.email === 'string' ? body.email : null;
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'CONTROLLER',
            stage: 'ENTRY',
            message: 'Entered AuthController.register',
            requestId,
            method: 'POST',
            url: '/api/auth/register',
            details: { identifier: (0, auth_log_service_1.maskEmailOrIdentifier)(rawEmailForMask), role: body?.role },
        });
        const validation = validateRegisterInput(body);
        if (!validation.valid || !validation.data) {
            const durationMs = Date.now() - startMs;
            const errorMsg = validation.errors.join(' | ');
            res.status(common_1.HttpStatus.BAD_REQUEST);
            (0, radinet_logger_1.logRadinet)({
                level: 'WARN',
                category: 'CONTROLLER',
                stage: 'DTO_VALIDATION',
                message: `Validation failed in register: ${errorMsg}`,
                requestId,
                method: 'POST',
                url: '/api/auth/register',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                durationMs,
                details: { errors: validation.errors },
            });
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'WARN',
                operation: 'REGISTER',
                method: 'POST',
                routePath: '/api/auth/register',
                targetUrl: '/api/auth/register',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                durationMs,
                backendReached: true,
                dtoValidationPassed: false,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'DTO_VALIDATION',
                errorCategory: 'VALIDATION',
                errorMessage: errorMsg,
                rawIdentifier: rawEmailForMask,
                metadata: {
                    validationErrors: validation.errors,
                    receivedKeys: body && typeof body === 'object' ? Object.keys(body) : [],
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                requestId,
                backendReached: true,
                code: 'VALIDATION_ERROR',
                stage: 'DTO_VALIDATION',
                error: errorMsg,
                message: validation.errors,
            };
        }
        const { fullName, email: normalizedEmail, password, role } = validation.data;
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'CONTROLLER',
            stage: 'DATABASE_QUERY',
            message: 'Checking for existing user with email in database',
            requestId,
            method: 'POST',
            url: '/api/auth/register',
            details: { email: (0, auth_log_service_1.maskEmailOrIdentifier)(normalizedEmail), role },
        });
        try {
            const existing = await this.prisma.user.findFirst({
                where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
            });
            if (existing) {
                const durationMs = Date.now() - startMs;
                const duplicateMsg = 'این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.';
                res.status(common_1.HttpStatus.CONFLICT);
                await this.authLogService.recordLog({
                    requestId,
                    source: 'backend',
                    level: 'WARN',
                    operation: 'REGISTER',
                    method: 'POST',
                    routePath: '/api/auth/register',
                    targetUrl: '/api/auth/register',
                    statusCode: common_1.HttpStatus.CONFLICT,
                    durationMs,
                    backendReached: true,
                    dtoValidationPassed: true,
                    operationResult: 'FAILED',
                    connectionStatus: 'CONNECTED',
                    failureStage: 'DUPLICATE_USER',
                    errorCategory: 'AUTH',
                    errorMessage: duplicateMsg,
                    rawIdentifier: normalizedEmail,
                    metadata: {
                        reason: 'EMAIL_ALREADY_EXISTS',
                    },
                    startedAt,
                    completedAt: new Date(),
                });
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.CONFLICT,
                    requestId,
                    backendReached: true,
                    code: 'EMAIL_EXISTS',
                    stage: 'DUPLICATE_USER',
                    error: duplicateMsg,
                    message: duplicateMsg,
                };
            }
            const passwordHash = await bcrypt.hash(password, 10);
            (0, radinet_logger_1.logRadinet)({
                level: 'INFO',
                category: 'CONTROLLER',
                stage: 'DATABASE_CREATE',
                message: 'Password hashed. Creating new user record in PostgreSQL...',
                requestId,
                method: 'POST',
                url: '/api/auth/register',
            });
            const user = await this.prisma.user.create({
                data: {
                    fullName,
                    email: normalizedEmail,
                    passwordHash,
                    role,
                },
            });
            (0, radinet_logger_1.logRadinet)({
                level: 'INFO',
                category: 'CONTROLLER',
                stage: 'TOKEN_SIGN',
                message: `User created with ID ${user.id}. Signing JWT token...`,
                requestId,
                method: 'POST',
                url: '/api/auth/register',
            });
            const token = signToken({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
            });
            const durationMs = Date.now() - startMs;
            res.status(common_1.HttpStatus.OK);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'INFO',
                operation: 'REGISTER',
                method: 'POST',
                routePath: '/api/auth/register',
                targetUrl: '/api/auth/register',
                statusCode: common_1.HttpStatus.OK,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'SUCCESS',
                connectionStatus: 'CONNECTED',
                failureStage: 'NONE',
                errorCategory: 'NONE',
                errorMessage: null,
                rawIdentifier: normalizedEmail,
                metadata: {
                    userId: user.id,
                    role: user.role,
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: true,
                statusCode: common_1.HttpStatus.OK,
                requestId,
                backendReached: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    organizationId: user.organizationId,
                },
            };
        }
        catch (err) {
            const durationMs = Date.now() - startMs;
            const dbErr = classifyDatabaseError(err);
            res.status(dbErr.statusCode);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'ERROR',
                operation: 'REGISTER',
                method: 'POST',
                routePath: '/api/auth/register',
                targetUrl: '/api/auth/register',
                statusCode: dbErr.statusCode,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'BACKEND_DATABASE',
                errorCategory: 'DATABASE',
                errorMessage: `${dbErr.userMessage} (${dbErr.code})`,
                rawIdentifier: normalizedEmail,
                metadata: {
                    dbErrorCode: dbErr.code,
                    technicalSummary: dbErr.technicalSummary,
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: dbErr.statusCode,
                requestId,
                backendReached: true,
                code: dbErr.code,
                stage: 'BACKEND_DATABASE',
                error: dbErr.userMessage,
                message: dbErr.userMessage,
            };
        }
    }
    async login(body, incomingRequestId, res) {
        const startedAt = new Date();
        const startMs = Date.now();
        const requestId = incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Backend-Reached', 'true');
        const rawEmailForMask = typeof body?.email === 'string' ? body.email : null;
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'CONTROLLER',
            stage: 'ENTRY',
            message: 'Entered AuthController.login',
            requestId,
            method: 'POST',
            url: '/api/auth/login',
            details: { identifier: (0, auth_log_service_1.maskEmailOrIdentifier)(rawEmailForMask) },
        });
        const validation = validateLoginInput(body);
        if (!validation.valid || !validation.data) {
            const durationMs = Date.now() - startMs;
            const errorMsg = validation.errors.join(' | ');
            res.status(common_1.HttpStatus.BAD_REQUEST);
            (0, radinet_logger_1.logRadinet)({
                level: 'WARN',
                category: 'CONTROLLER',
                stage: 'DTO_VALIDATION',
                message: `Validation failed in login: ${errorMsg}`,
                requestId,
                method: 'POST',
                url: '/api/auth/login',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                durationMs,
                details: { errors: validation.errors },
            });
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'WARN',
                operation: 'LOGIN',
                method: 'POST',
                routePath: '/api/auth/login',
                targetUrl: '/api/auth/login',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                durationMs,
                backendReached: true,
                dtoValidationPassed: false,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'DTO_VALIDATION',
                errorCategory: 'VALIDATION',
                errorMessage: errorMsg,
                rawIdentifier: rawEmailForMask,
                metadata: {
                    validationErrors: validation.errors,
                    receivedKeys: body && typeof body === 'object' ? Object.keys(body) : [],
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                requestId,
                backendReached: true,
                code: 'VALIDATION_ERROR',
                stage: 'DTO_VALIDATION',
                error: errorMsg,
                message: validation.errors,
            };
        }
        const { email: normalizedEmail, password } = validation.data;
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'CONTROLLER',
            stage: 'DATABASE_QUERY',
            message: 'Querying user by email for authentication',
            requestId,
            method: 'POST',
            url: '/api/auth/login',
            details: { email: (0, auth_log_service_1.maskEmailOrIdentifier)(normalizedEmail) },
        });
        try {
            const user = await this.prisma.user.findFirst({
                where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
            });
            if (!user) {
                const durationMs = Date.now() - startMs;
                const msg = 'ایمیل یا رمز عبور اشتباه است.';
                res.status(common_1.HttpStatus.UNAUTHORIZED);
                await this.authLogService.recordLog({
                    requestId,
                    source: 'backend',
                    level: 'WARN',
                    operation: 'LOGIN',
                    method: 'POST',
                    routePath: '/api/auth/login',
                    targetUrl: '/api/auth/login',
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    durationMs,
                    backendReached: true,
                    dtoValidationPassed: true,
                    operationResult: 'FAILED',
                    connectionStatus: 'CONNECTED',
                    failureStage: 'USER_NOT_FOUND',
                    errorCategory: 'AUTH',
                    errorMessage: msg,
                    rawIdentifier: normalizedEmail,
                    metadata: { reason: 'USER_NOT_FOUND' },
                    startedAt,
                    completedAt: new Date(),
                });
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    requestId,
                    backendReached: true,
                    code: 'INVALID_CREDENTIALS',
                    stage: 'USER_NOT_FOUND',
                    error: msg,
                    message: msg,
                };
            }
            let valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid && password.trim() !== password) {
                valid = await bcrypt.compare(password.trim(), user.passwordHash);
            }
            if (!valid) {
                const durationMs = Date.now() - startMs;
                const msg = 'ایمیل یا رمز عبور اشتباه است.';
                res.status(common_1.HttpStatus.UNAUTHORIZED);
                await this.authLogService.recordLog({
                    requestId,
                    source: 'backend',
                    level: 'WARN',
                    operation: 'LOGIN',
                    method: 'POST',
                    routePath: '/api/auth/login',
                    targetUrl: '/api/auth/login',
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    durationMs,
                    backendReached: true,
                    dtoValidationPassed: true,
                    operationResult: 'FAILED',
                    connectionStatus: 'CONNECTED',
                    failureStage: 'INVALID_PASSWORD',
                    errorCategory: 'AUTH',
                    errorMessage: msg,
                    rawIdentifier: normalizedEmail,
                    metadata: { reason: 'PASSWORD_MISMATCH', userId: user.id },
                    startedAt,
                    completedAt: new Date(),
                });
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    requestId,
                    backendReached: true,
                    code: 'INVALID_CREDENTIALS',
                    stage: 'INVALID_PASSWORD',
                    error: msg,
                    message: msg,
                };
            }
            if (user.status === 'inactive' || user.status === 'suspended') {
                const durationMs = Date.now() - startMs;
                const msg = 'حساب کاربری شما غیرفعال یا معلق است.';
                res.status(common_1.HttpStatus.FORBIDDEN);
                await this.authLogService.recordLog({
                    requestId,
                    source: 'backend',
                    level: 'WARN',
                    operation: 'LOGIN',
                    method: 'POST',
                    routePath: '/api/auth/login',
                    targetUrl: '/api/auth/login',
                    statusCode: common_1.HttpStatus.FORBIDDEN,
                    durationMs,
                    backendReached: true,
                    dtoValidationPassed: true,
                    operationResult: 'FAILED',
                    connectionStatus: 'CONNECTED',
                    failureStage: 'ACCOUNT_STATUS',
                    errorCategory: 'AUTH',
                    errorMessage: msg,
                    rawIdentifier: normalizedEmail,
                    metadata: { reason: 'ACCOUNT_INACTIVE_OR_SUSPENDED', status: user.status },
                    startedAt,
                    completedAt: new Date(),
                });
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.FORBIDDEN,
                    requestId,
                    backendReached: true,
                    code: 'ACCOUNT_SUSPENDED',
                    stage: 'ACCOUNT_STATUS',
                    error: msg,
                    message: msg,
                };
            }
            if (!ALLOWED_LOGIN_ROLES.has(user.role)) {
                const durationMs = Date.now() - startMs;
                const msg = 'نقش کاربری شما مجوز ورود به این بخش را ندارد.';
                res.status(common_1.HttpStatus.FORBIDDEN);
                await this.authLogService.recordLog({
                    requestId,
                    source: 'backend',
                    level: 'WARN',
                    operation: 'LOGIN',
                    method: 'POST',
                    routePath: '/api/auth/login',
                    targetUrl: '/api/auth/login',
                    statusCode: common_1.HttpStatus.FORBIDDEN,
                    durationMs,
                    backendReached: true,
                    dtoValidationPassed: true,
                    operationResult: 'FAILED',
                    connectionStatus: 'CONNECTED',
                    failureStage: 'ROLE_FORBIDDEN',
                    errorCategory: 'AUTH',
                    errorMessage: msg,
                    rawIdentifier: normalizedEmail,
                    metadata: { reason: 'ROLE_NOT_ALLOWED', role: user.role },
                    startedAt,
                    completedAt: new Date(),
                });
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.FORBIDDEN,
                    requestId,
                    backendReached: true,
                    code: 'ROLE_FORBIDDEN',
                    stage: 'ROLE_FORBIDDEN',
                    error: msg,
                    message: msg,
                };
            }
            const token = signToken({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
            });
            const durationMs = Date.now() - startMs;
            res.status(common_1.HttpStatus.OK);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'INFO',
                operation: 'LOGIN',
                method: 'POST',
                routePath: '/api/auth/login',
                targetUrl: '/api/auth/login',
                statusCode: common_1.HttpStatus.OK,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'SUCCESS',
                connectionStatus: 'CONNECTED',
                failureStage: 'NONE',
                errorCategory: 'NONE',
                errorMessage: null,
                rawIdentifier: normalizedEmail,
                metadata: {
                    userId: user.id,
                    role: user.role,
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: true,
                statusCode: common_1.HttpStatus.OK,
                requestId,
                backendReached: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    organizationId: user.organizationId,
                },
            };
        }
        catch (err) {
            const durationMs = Date.now() - startMs;
            const dbErr = classifyDatabaseError(err);
            res.status(dbErr.statusCode);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'ERROR',
                operation: 'LOGIN',
                method: 'POST',
                routePath: '/api/auth/login',
                targetUrl: '/api/auth/login',
                statusCode: dbErr.statusCode,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'BACKEND_DATABASE',
                errorCategory: 'DATABASE',
                errorMessage: `${dbErr.userMessage} (${dbErr.code})`,
                rawIdentifier: normalizedEmail,
                metadata: {
                    dbErrorCode: dbErr.code,
                    technicalSummary: dbErr.technicalSummary,
                },
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: dbErr.statusCode,
                requestId,
                backendReached: true,
                code: dbErr.code,
                stage: 'BACKEND_DATABASE',
                error: dbErr.userMessage,
                message: dbErr.userMessage,
            };
        }
    }
    async me(auth, incomingRequestId, res) {
        const startedAt = new Date();
        const startMs = Date.now();
        const requestId = incomingRequestId?.trim() || (0, auth_log_service_1.generateRequestId)();
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Backend-Reached', 'true');
        if (!auth?.startsWith('Bearer ')) {
            res.status(common_1.HttpStatus.UNAUTHORIZED);
            return {
                ok: false,
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
                requestId,
                backendReached: true,
                error: 'توکن احراز هویت ارسال نشده است.',
            };
        }
        const token = auth.slice('Bearer '.length).trim();
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        }
        catch {
            const durationMs = Date.now() - startMs;
            res.status(common_1.HttpStatus.UNAUTHORIZED);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'WARN',
                operation: 'AUTH_ME',
                method: 'GET',
                routePath: '/api/auth/me',
                targetUrl: '/api/auth/me',
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'TOKEN_VERIFY',
                errorCategory: 'AUTH',
                errorMessage: 'توکن نامعتبر یا منقضی شده است (یا JWT_SECRET همخوانی ندارد).',
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
                requestId,
                backendReached: true,
                error: 'توکن نامعتبر یا منقضی شده است.',
            };
        }
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                res.status(common_1.HttpStatus.UNAUTHORIZED);
                return {
                    ok: false,
                    statusCode: common_1.HttpStatus.UNAUTHORIZED,
                    requestId,
                    backendReached: true,
                    error: 'کاربر یافت نشد.',
                };
            }
            res.status(common_1.HttpStatus.OK);
            return {
                ok: true,
                statusCode: common_1.HttpStatus.OK,
                requestId,
                backendReached: true,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    organizationId: user.organizationId,
                },
            };
        }
        catch (err) {
            const durationMs = Date.now() - startMs;
            const dbErr = classifyDatabaseError(err);
            res.status(dbErr.statusCode);
            await this.authLogService.recordLog({
                requestId,
                source: 'backend',
                level: 'ERROR',
                operation: 'AUTH_ME',
                method: 'GET',
                routePath: '/api/auth/me',
                targetUrl: '/api/auth/me',
                statusCode: dbErr.statusCode,
                durationMs,
                backendReached: true,
                dtoValidationPassed: true,
                operationResult: 'FAILED',
                connectionStatus: 'CONNECTED',
                failureStage: 'BACKEND_DATABASE',
                errorCategory: 'DATABASE',
                errorMessage: `${dbErr.userMessage} (${dbErr.code})`,
                rawIdentifier: (0, auth_log_service_1.maskEmailOrIdentifier)(typeof payload.email === 'string' ? payload.email : null),
                startedAt,
                completedAt: new Date(),
            });
            return {
                ok: false,
                statusCode: dbErr.statusCode,
                requestId,
                backendReached: true,
                error: dbErr.userMessage,
            };
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Headers)('x-request-id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-request-id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-request-id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Headers)('x-request-id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_log_service_1.AuthLogService])
], AuthController);
