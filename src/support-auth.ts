import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

export type SupportIdentity = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

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

export function verifySupportToken(auth?: string): SupportIdentity {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const token = auth.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const roleStr = String(payload.role || '');
    const normalizedRole = roleStr.toLowerCase();
    const isAllowed =
      ALLOWED_SUPPORT_ROLES.has(roleStr) ||
      ALLOWED_SUPPORT_ROLES.has(normalizedRole) ||
      normalizedRole === 'admin' ||
      normalizedRole.startsWith('support') ||
      normalizedRole === 'org_admin';
    if (!isAllowed) {
      throw new UnauthorizedException('دسترسی فقط برای کارشناس پشتیبانی مجاز است');
    }
    const sub = String(payload.sub || payload.userId || payload.id || '');
    const email = String(payload.email || '');
    if (!sub || !email) {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
    return {
      id: sub,
      email,
      role: roleStr,
      name: typeof payload.name === 'string' ? payload.name : (typeof payload.fullName === 'string' ? payload.fullName : undefined),
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

@Injectable()
export class SupportExpertGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string }; supportIdentity?: SupportIdentity }>();
    request.supportIdentity = verifySupportToken(request.headers?.authorization);
    return true;
  }
}

export function verifySocketSupport(socket: Socket): SupportIdentity {
  const authHeader = typeof socket.handshake.auth?.token === 'string'
    ? `Bearer ${socket.handshake.auth.token}`
    : socket.handshake.headers.authorization;
  const identity = verifySupportToken(authHeader);
  socket.data.supportIdentity = identity;
  return identity;
}
