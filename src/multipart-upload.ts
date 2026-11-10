import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  createParamDecorator,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import type { IncomingMessage } from 'http';
import { basename, extname, join } from 'path';
import type { Observable } from 'rxjs';

export interface StoredUploadFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface MultipartUploadOptions {
  fieldName?: string;
  destination?: string;
  maxFiles?: number;
  maxFileSize?: number;
  maxFieldSize?: number;
  allowedMimeTypes?: ReadonlySet<string>;
  allowedExtensions?: ReadonlySet<string>;
  invalidFileMessage?: string;
}

export interface MultipartCapableRequest extends IncomingMessage {
  body?: Record<string, unknown>;
  uploadedFiles?: StoredUploadFile[];
  uploadedFile?: StoredUploadFile;
}

function extractBoundary(contentTypeHeader: string): string | null {
  const match = /boundary=(?:"([^"]+)"|([^;,\s]+))/i.exec(contentTypeHeader);
  const boundary = match?.[1] ?? match?.[2] ?? '';
  return boundary.trim() || null;
}

function sanitizeOriginalFilename(rawName: string): string {
  let decoded = rawName.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep raw name if not percent-encoded
  }
  const stripped = basename(decoded.replace(/\\/g, '/')).replace(/[\r\n\0]/g, '');
  return stripped || 'upload.bin';
}

function parsePartHeaders(rawHeaders: string): {
  fieldName: string | null;
  fileName: string | null;
  contentType: string;
  encoding: string;
} {
  const lines = rawHeaders.split(/\r?\n/);
  let fieldName: string | null = null;
  let fileName: string | null = null;
  let contentType = 'application/octet-stream';
  let encoding = '7bit';

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const headerName = line.slice(0, colonIndex).trim().toLowerCase();
    const headerValue = line.slice(colonIndex + 1).trim();

    if (headerName === 'content-disposition') {
      const nameMatch = /\bname=(?:"([^"]*)"|([^;\s]+))/i.exec(headerValue);
      if (nameMatch) {
        fieldName = nameMatch[1] ?? nameMatch[2] ?? null;
      }

      const filenameStarMatch = /\bfilename\*=UTF-8''([^;\s]+)/i.exec(headerValue);
      const filenameMatch = /\bfilename=(?:"([^"]*)"|([^;\s]+))/i.exec(headerValue);
      if (filenameStarMatch?.[1]) {
        fileName = filenameStarMatch[1];
      } else if (filenameMatch) {
        fileName = filenameMatch[1] ?? filenameMatch[2] ?? '';
      }
    } else if (headerName === 'content-type') {
      const semiIndex = headerValue.indexOf(';');
      contentType = (semiIndex === -1 ? headerValue : headerValue.slice(0, semiIndex))
        .trim()
        .toLowerCase();
    } else if (headerName === 'content-transfer-encoding') {
      encoding = headerValue.toLowerCase();
    }
  }

  return { fieldName, fileName, contentType, encoding };
}

function readRawRequestStream(req: IncomingMessage, maxTotalBytes: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    const onData = (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > maxTotalBytes) {
        settled = true;
        cleanupListeners();
        reject(new BadRequestException('حجم فایل‌های ارسالی بیش از حد مجاز است'));
        return;
      }
      chunks.push(buf);
    };

    const onEnd = () => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      resolve(Buffer.concat(chunks, totalBytes));
    };

    const onError = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      reject(new BadRequestException(`خطا در دریافت فایل‌های ارسالی: ${err.message}`));
    };

    const cleanupListeners = () => {
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onError);
    };

    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
  });
}

async function cleanupSavedFiles(files: StoredUploadFile[]): Promise<void> {
  await Promise.all(
    files.map(async (f) => {
      if (f.path) {
        try {
          await fs.unlink(f.path);
        } catch {
          // Ignore unlink errors during cleanup
        }
      }
    }),
  );
}

export async function parseMultipartRequest(
  req: MultipartCapableRequest,
  options: MultipartUploadOptions = {},
): Promise<{ fields: Record<string, string>; files: StoredUploadFile[] }> {
  const rawContentType = req.headers?.['content-type'];
  const contentType = Array.isArray(rawContentType)
    ? rawContentType.join('; ')
    : (rawContentType ?? '');

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    const existingFields: Record<string, string> = {};
    if (req.body && typeof req.body === 'object') {
      for (const [key, val] of Object.entries(req.body)) {
        if (typeof val === 'string') {
          existingFields[key] = val;
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          existingFields[key] = String(val);
        }
      }
    }
    return { fields: existingFields, files: [] };
  }

  const boundary = extractBoundary(contentType);
  if (!boundary) {
    throw new BadRequestException('ساختار درخواست چندبخشی (multipart/form-data) نامعتبر است');
  }

  const maxFiles = options.maxFiles ?? 20;
  const maxFileSize = options.maxFileSize ?? 25 * 1024 * 1024;
  const maxFieldSize = options.maxFieldSize ?? 2 * 1024 * 1024;
  const maxTotalBytes = maxFiles * maxFileSize + 20 * maxFieldSize + 2 * 1024 * 1024;

  const rawBuffer = await readRawRequestStream(req, maxTotalBytes);
  const fields: Record<string, string> = {};
  const files: StoredUploadFile[] = [];

  if (rawBuffer.length === 0) {
    return { fields, files };
  }

  const startBoundary = Buffer.from(`--${boundary}`);
  const delimiterBoundary = Buffer.from(`\r\n--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');
  const altHeaderSeparator = Buffer.from('\n\n');

  if (options.destination) {
    await fs.mkdir(options.destination, { recursive: true });
  }

  let pos = rawBuffer.indexOf(startBoundary);

  try {
    while (pos !== -1) {
      let partStart = pos + startBoundary.length;
      if (partStart >= rawBuffer.length) break;

      // Check for closing boundary `--boundary--`
      if (
        partStart + 1 < rawBuffer.length &&
        rawBuffer[partStart] === 0x2d &&
        rawBuffer[partStart + 1] === 0x2d
      ) {
        break;
      }

      // Advance past CRLF or LF after boundary
      if (
        partStart + 1 < rawBuffer.length &&
        rawBuffer[partStart] === 0x0d &&
        rawBuffer[partStart + 1] === 0x0a
      ) {
        partStart += 2;
      } else if (rawBuffer[partStart] === 0x0a) {
        partStart += 1;
      }

      const nextPos = rawBuffer.indexOf(delimiterBoundary, partStart);
      if (nextPos === -1) break;

      const partBuffer = rawBuffer.subarray(partStart, nextPos);
      let headerEnd = partBuffer.indexOf(headerSeparator);
      let separatorLength = 4;
      if (headerEnd === -1) {
        headerEnd = partBuffer.indexOf(altHeaderSeparator);
        separatorLength = 2;
      }

      if (headerEnd !== -1) {
        const rawHeaders = partBuffer.subarray(0, headerEnd).toString('utf8');
        const bodySlice = partBuffer.subarray(headerEnd + separatorLength);
        const { fieldName, fileName, contentType: partMime, encoding } = parsePartHeaders(rawHeaders);

        if (fileName !== null) {
          // File part
          if (fileName.trim() !== '') {
            if (options.fieldName && fieldName && fieldName !== options.fieldName) {
              throw new BadRequestException(`فیلد فایل ارسالی (${fieldName}) مجاز نیست`);
            }

            if (files.length >= maxFiles) {
              throw new BadRequestException(`حداکثر تعداد فایل مجاز ${maxFiles} عدد است`);
            }

            if (bodySlice.length > maxFileSize) {
              const maxMb = Math.round((maxFileSize / (1024 * 1024)) * 10) / 10;
              throw new BadRequestException(`حجم هر فایل نباید بیشتر از ${maxMb} مگابایت باشد`);
            }

            const safeOriginalName = sanitizeOriginalFilename(fileName);
            const rawExt = extname(safeOriginalName).toLowerCase();
            const safeExt = rawExt.replace(/[^a-z0-9.]/g, '').slice(0, 12);

            if (options.allowedMimeTypes && !options.allowedMimeTypes.has(partMime)) {
              throw new BadRequestException(options.invalidFileMessage ?? 'فرمت فایل مجاز نیست');
            }

            if (options.allowedExtensions && !options.allowedExtensions.has(safeExt)) {
              throw new BadRequestException(options.invalidFileMessage ?? 'فرمت فایل مجاز نیست');
            }

            const fileBuffer = Buffer.from(bodySlice);
            const storedFilename = `${randomUUID()}${safeExt}`;
            let destinationDir = '';
            let storedPath = '';

            if (options.destination) {
              destinationDir = options.destination;
              storedPath = join(options.destination, storedFilename);
              await fs.writeFile(storedPath, fileBuffer);
            }

            files.push({
              fieldname: fieldName ?? options.fieldName ?? 'file',
              originalname: safeOriginalName,
              encoding,
              mimetype: partMime,
              size: fileBuffer.length,
              destination: destinationDir,
              filename: storedFilename,
              path: storedPath,
              buffer: fileBuffer,
            });
          }
        } else if (fieldName) {
          // Regular form field
          if (bodySlice.length > maxFieldSize) {
            throw new BadRequestException('حجم اطلاعات متنی فرم بیش از حد مجاز است');
          }
          fields[fieldName] = bodySlice.toString('utf8');
        }
      }

      // Move to the `--` of `\r\n--boundary`
      pos = nextPos + 2;
    }
  } catch (error) {
    await cleanupSavedFiles(files);
    throw error;
  }

  return { fields, files };
}

@Injectable()
export class MultipartUploadInterceptor implements NestInterceptor {
  constructor(private readonly options: MultipartUploadOptions = {}) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<MultipartCapableRequest>();
    const rawContentType = req.headers?.['content-type'];
    const contentType = Array.isArray(rawContentType)
      ? rawContentType.join('; ')
      : (rawContentType ?? '');

    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const parsed = await parseMultipartRequest(req, this.options);
      req.body = {
        ...(req.body && typeof req.body === 'object' ? req.body : {}),
        ...parsed.fields,
      };
      req.uploadedFiles = parsed.files;
      req.uploadedFile = parsed.files[0];
    } else {
      req.uploadedFiles = [];
      req.uploadedFile = undefined;
    }

    return next.handle();
  }
}

export const UploadedMultipartFiles = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StoredUploadFile[] => {
    const req = ctx.switchToHttp().getRequest<MultipartCapableRequest>();
    return req.uploadedFiles ?? [];
  },
);

export const UploadedMultipartFile = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StoredUploadFile | undefined => {
    const req = ctx.switchToHttp().getRequest<MultipartCapableRequest>();
    return req.uploadedFile;
  },
);
