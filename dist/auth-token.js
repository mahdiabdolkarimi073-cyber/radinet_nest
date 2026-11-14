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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_TTL = exports.JWT_SECRET = void 0;
exports.verifyAuthToken = verifyAuthToken;
exports.tryVerifyAuthToken = tryVerifyAuthToken;
exports.verifyAdminToken = verifyAdminToken;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
exports.TOKEN_TTL = '7d';
/**
 * Extracts and cryptographically verifies a Bearer JWT token from the Authorization header.
 * Enforces signature verification and expiration (exp).
 */
function verifyAuthToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new common_1.UnauthorizedException('توکن احراز هویت ارسال نشده است');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        throw new common_1.UnauthorizedException('توکن احراز هویت خالی است');
    }
    let decoded;
    try {
        decoded = jwt.verify(token, exports.JWT_SECRET);
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر یا منقضی شده است');
    }
    const sub = typeof decoded === 'object' && decoded !== null
        ? typeof decoded.sub === 'string' && decoded.sub.trim()
            ? decoded.sub.trim()
            : typeof decoded.userId === 'string'
                ? String(decoded.userId).trim()
                : ''
        : '';
    if (typeof decoded !== 'object' ||
        decoded === null ||
        !sub ||
        typeof decoded.role !== 'string') {
        throw new common_1.UnauthorizedException('ساختار توکن نامعتبر است');
    }
    return {
        sub,
        userId: sub,
        email: typeof decoded.email === 'string' ? decoded.email : '',
        role: decoded.role,
        name: typeof decoded.name === 'string' ? decoded.name : undefined,
        organizationId: typeof decoded.organizationId === 'string' ? decoded.organizationId : null,
        iat: decoded.iat,
        exp: decoded.exp,
    };
}
/**
 * Attempts to verify the token if present; returns null instead of throwing when absent/invalid.
 */
function tryVerifyAuthToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    try {
        return verifyAuthToken(authHeader);
    }
    catch {
        return null;
    }
}
/**
 * Verifies the token and ensures the user has the 'admin' role.
 */
function verifyAdminToken(authHeader) {
    const payload = verifyAuthToken(authHeader);
    const role = payload.role.toLowerCase();
    if (role !== 'admin') {
        throw new common_1.ForbiddenException('دسترسی فقط برای مدیر سامانه (admin) مجاز است');
    }
    return payload;
}
