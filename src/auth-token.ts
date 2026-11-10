import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
export const TOKEN_TTL = '7d';

export type AuthTokenPayload = {
  sub: string;
  userId: string;
  email: string;
  role: string;
  name?: string;
  organizationId?: string | null;
  iat?: number;
  exp?: number;
};

/**
 * Extracts and cryptographically verifies a Bearer JWT token from the Authorization header.
 * Enforces signature verification and expiration (exp).
 */
export function verifyAuthToken(authHeader?: string): AuthTokenPayload {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('توکن احراز هویت ارسال نشده است');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedException('توکن احراز هویت خالی است');
  }

  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است');
  }

  const sub =
    typeof decoded === 'object' && decoded !== null
      ? typeof decoded.sub === 'string' && decoded.sub.trim()
        ? decoded.sub.trim()
        : typeof (decoded as Record<string, unknown>).userId === 'string'
          ? String((decoded as Record<string, unknown>).userId).trim()
          : ''
      : '';

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !sub ||
    typeof decoded.role !== 'string'
  ) {
    throw new UnauthorizedException('ساختار توکن نامعتبر است');
  }

  return {
    sub,
    userId: sub,
    email: typeof decoded.email === 'string' ? decoded.email : '',
    role: decoded.role,
    name: typeof decoded.name === 'string' ? decoded.name : undefined,
    organizationId:
      typeof decoded.organizationId === 'string' ? decoded.organizationId : null,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

/**
 * Attempts to verify the token if present; returns null instead of throwing when absent/invalid.
 */
export function tryVerifyAuthToken(authHeader?: string): AuthTokenPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return verifyAuthToken(authHeader);
  } catch {
    return null;
  }
}

/**
 * Verifies the token and ensures the user has the 'admin' role.
 */
export function verifyAdminToken(authHeader?: string): AuthTokenPayload {
  const payload = verifyAuthToken(authHeader);
  const role = payload.role.toLowerCase();
  if (role !== 'admin') {
    throw new ForbiddenException('دسترسی فقط برای مدیر سامانه (admin) مجاز است');
  }
  return payload;
}
