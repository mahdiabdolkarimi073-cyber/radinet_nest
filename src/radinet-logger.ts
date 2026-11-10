import { randomUUID } from 'crypto';

export type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export const SENSITIVE_KEY_REGEX =
  /password|pass|pwd|secret|token|cookie|authorization|auth_token|jwt|credential|private|credit|cvv/i;

export function getRequestIdFromHeader(rawId?: string | string[]): string {
  if (typeof rawId === 'string' && rawId.trim().length > 0) {
    return rawId.trim();
  }
  if (Array.isArray(rawId) && rawId[0] && rawId[0].trim().length > 0) {
    return rawId[0].trim();
  }
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, '').slice(0, 10);
  return `req_${ts}_${rand}`;
}

export function maskSensitiveValue(key: string, val: unknown): unknown {
  if (SENSITIVE_KEY_REGEX.test(key)) {
    return '[REDACTED]';
  }
  if (typeof val === 'string') {
    if (key.toLowerCase().includes('email')) {
      const at = val.indexOf('@');
      if (at > 1) {
        return `${val[0]}***${val.slice(at - 1)}`;
      }
    }
    if (val.length > 500) {
      return `${val.slice(0, 500)}...[TRUNCATED]`;
    }
  }
  return val;
}

export function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 4) return '[MAX_DEPTH]';
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.slice(0, 25).map((item) => sanitizeObject(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(k)) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      clean[k] = sanitizeObject(v, depth + 1);
    } else {
      clean[k] = maskSensitiveValue(k, v);
    }
  }
  return clean;
}

export interface RadinetLogPayload {
  level: LogSeverity;
  category: 'STARTUP' | 'SHUTDOWN' | 'REQUEST' | 'CONTROLLER' | 'DATABASE' | 'ERROR' | 'UNCAUGHT';
  message: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  stage?: string;
  error?: string;
  stack?: string;
  details?: Record<string, unknown>;
}

export function logRadinet(payload: RadinetLogPayload): void {
  const now = new Date().toISOString();
  const reqTag = payload.requestId ? ` [${payload.requestId}]` : '';
  const methodTag = payload.method ? ` ${payload.method}` : '';
  const urlTag = payload.url ? ` ${payload.url}` : '';
  const statusTag = payload.statusCode !== undefined ? ` -> ${payload.statusCode}` : '';
  const durTag = payload.durationMs !== undefined ? ` (${payload.durationMs}ms)` : '';
  const ipTag = payload.ip ? ` from ${payload.ip}` : '';
  const stageTag = payload.stage ? ` [Stage: ${payload.stage}]` : '';

  const header = `[RADINET_BACKEND] [${now}] [${payload.level}] [${payload.category}]${reqTag}${stageTag}${methodTag}${urlTag}${statusTag}${durTag}${ipTag} - ${payload.message}`;

  if (payload.level === 'ERROR') {
    console.error(header);
    if (payload.error) {
      console.error(`[RADINET_BACKEND] [ERROR_DETAIL]${reqTag} ${payload.error}`);
    }
    if (payload.stack) {
      console.error(`[RADINET_BACKEND] [STACK_TRACE]${reqTag}\n${payload.stack}`);
    }
  } else if (payload.level === 'WARN') {
    console.warn(header);
    if (payload.error) {
      console.warn(`[RADINET_BACKEND] [WARN_DETAIL]${reqTag} ${payload.error}`);
    }
  } else {
    console.log(header);
  }

  if (payload.details && Object.keys(payload.details).length > 0) {
    try {
      const sanitized = sanitizeObject(payload.details);
      const str = JSON.stringify(sanitized);
      if (str && str !== '{}') {
        console.log(`[RADINET_BACKEND] [DATA]${reqTag} ${str}`);
      }
    } catch {
      // Ignore serialization errors in logger
    }
  }
}
