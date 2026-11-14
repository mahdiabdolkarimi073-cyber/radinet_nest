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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportExpertGuard = void 0;
exports.verifySupportToken = verifySupportToken;
exports.verifySocketSupport = verifySocketSupport;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
const ALLOWED_SUPPORT_ROLES = new Set([
    'SUPPORT_EXPERT',
    'support_expert',
    'SUPPORT_ADMIN',
    'support_admin',
    'SUPPORT_AGENT',
    'support_agent',
    'SUPPORT',
    'support',
    'ADMIN',
    'admin',
    'ORG_ADMIN',
    'org_admin',
]);
function verifySupportToken(auth) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    try {
        const token = auth.slice('Bearer '.length).trim();
        const payload = jwt.verify(token, JWT_SECRET);
        const roleStr = String(payload.role || '');
        const normalizedRole = roleStr.toLowerCase();
        const isAllowed = ALLOWED_SUPPORT_ROLES.has(roleStr) ||
            ALLOWED_SUPPORT_ROLES.has(normalizedRole) ||
            normalizedRole === 'admin' ||
            normalizedRole.startsWith('support') ||
            normalizedRole === 'org_admin';
        if (!isAllowed) {
            throw new common_1.UnauthorizedException('دسترسی فقط برای کارشناس پشتیبانی مجاز است');
        }
        const sub = String(payload.sub || payload.userId || payload.id || '');
        const email = String(payload.email || '');
        if (!sub || !email) {
            throw new common_1.UnauthorizedException('توکن نامعتبر است');
        }
        return {
            id: sub,
            email,
            role: roleStr,
            name: typeof payload.name === 'string' ? payload.name : (typeof payload.fullName === 'string' ? payload.fullName : undefined),
        };
    }
    catch (error) {
        if (error instanceof common_1.UnauthorizedException)
            throw error;
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
}
let SupportExpertGuard = class SupportExpertGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        request.supportIdentity = verifySupportToken(request.headers?.authorization);
        return true;
    }
};
exports.SupportExpertGuard = SupportExpertGuard;
exports.SupportExpertGuard = SupportExpertGuard = __decorate([
    (0, common_1.Injectable)()
], SupportExpertGuard);
function verifySocketSupport(socket) {
    const authHeader = typeof socket.handshake.auth?.token === 'string'
        ? `Bearer ${socket.handshake.auth.token}`
        : socket.handshake.headers.authorization;
    const identity = verifySupportToken(authHeader);
    socket.data.supportIdentity = identity;
    return identity;
}
