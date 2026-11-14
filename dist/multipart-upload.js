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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadedMultipartFile = exports.UploadedMultipartFiles = exports.MultipartUploadInterceptor = void 0;
exports.parseMultipartRequest = parseMultipartRequest;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
function extractBoundary(contentTypeHeader) {
    const match = /boundary=(?:"([^"]+)"|([^;,\s]+))/i.exec(contentTypeHeader);
    const boundary = match?.[1] ?? match?.[2] ?? '';
    return boundary.trim() || null;
}
function sanitizeOriginalFilename(rawName) {
    let decoded = rawName.trim();
    try {
        decoded = decodeURIComponent(decoded);
    }
    catch {
        // Keep raw name if not percent-encoded
    }
    const stripped = (0, path_1.basename)(decoded.replace(/\\/g, '/')).replace(/[\r\n\0]/g, '');
    return stripped || 'upload.bin';
}
function parsePartHeaders(rawHeaders) {
    const lines = rawHeaders.split(/\r?\n/);
    let fieldName = null;
    let fileName = null;
    let contentType = 'application/octet-stream';
    let encoding = '7bit';
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1)
            continue;
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
            }
            else if (filenameMatch) {
                fileName = filenameMatch[1] ?? filenameMatch[2] ?? '';
            }
        }
        else if (headerName === 'content-type') {
            const semiIndex = headerValue.indexOf(';');
            contentType = (semiIndex === -1 ? headerValue : headerValue.slice(0, semiIndex))
                .trim()
                .toLowerCase();
        }
        else if (headerName === 'content-transfer-encoding') {
            encoding = headerValue.toLowerCase();
        }
    }
    return { fieldName, fileName, contentType, encoding };
}
function readRawRequestStream(req, maxTotalBytes) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalBytes = 0;
        let settled = false;
        const onData = (chunk) => {
            if (settled)
                return;
            const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
            totalBytes += buf.length;
            if (totalBytes > maxTotalBytes) {
                settled = true;
                cleanupListeners();
                reject(new common_1.BadRequestException('حجم فایل‌های ارسالی بیش از حد مجاز است'));
                return;
            }
            chunks.push(buf);
        };
        const onEnd = () => {
            if (settled)
                return;
            settled = true;
            cleanupListeners();
            resolve(Buffer.concat(chunks, totalBytes));
        };
        const onError = (err) => {
            if (settled)
                return;
            settled = true;
            cleanupListeners();
            reject(new common_1.BadRequestException(`خطا در دریافت فایل‌های ارسالی: ${err.message}`));
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
async function cleanupSavedFiles(files) {
    await Promise.all(files.map(async (f) => {
        if (f.path) {
            try {
                await fs_1.promises.unlink(f.path);
            }
            catch {
                // Ignore unlink errors during cleanup
            }
        }
    }));
}
async function parseMultipartRequest(req, options = {}) {
    const rawContentType = req.headers?.['content-type'];
    const contentType = Array.isArray(rawContentType)
        ? rawContentType.join('; ')
        : (rawContentType ?? '');
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
        const existingFields = {};
        if (req.body && typeof req.body === 'object') {
            for (const [key, val] of Object.entries(req.body)) {
                if (typeof val === 'string') {
                    existingFields[key] = val;
                }
                else if (typeof val === 'number' || typeof val === 'boolean') {
                    existingFields[key] = String(val);
                }
            }
        }
        return { fields: existingFields, files: [] };
    }
    const boundary = extractBoundary(contentType);
    if (!boundary) {
        throw new common_1.BadRequestException('ساختار درخواست چندبخشی (multipart/form-data) نامعتبر است');
    }
    const maxFiles = options.maxFiles ?? 20;
    const maxFileSize = options.maxFileSize ?? 25 * 1024 * 1024;
    const maxFieldSize = options.maxFieldSize ?? 2 * 1024 * 1024;
    const maxTotalBytes = maxFiles * maxFileSize + 20 * maxFieldSize + 2 * 1024 * 1024;
    const rawBuffer = await readRawRequestStream(req, maxTotalBytes);
    const fields = {};
    const files = [];
    if (rawBuffer.length === 0) {
        return { fields, files };
    }
    const startBoundary = Buffer.from(`--${boundary}`);
    const delimiterBoundary = Buffer.from(`\r\n--${boundary}`);
    const headerSeparator = Buffer.from('\r\n\r\n');
    const altHeaderSeparator = Buffer.from('\n\n');
    if (options.destination) {
        await fs_1.promises.mkdir(options.destination, { recursive: true });
    }
    let pos = rawBuffer.indexOf(startBoundary);
    try {
        while (pos !== -1) {
            let partStart = pos + startBoundary.length;
            if (partStart >= rawBuffer.length)
                break;
            // Check for closing boundary `--boundary--`
            if (partStart + 1 < rawBuffer.length &&
                rawBuffer[partStart] === 0x2d &&
                rawBuffer[partStart + 1] === 0x2d) {
                break;
            }
            // Advance past CRLF or LF after boundary
            if (partStart + 1 < rawBuffer.length &&
                rawBuffer[partStart] === 0x0d &&
                rawBuffer[partStart + 1] === 0x0a) {
                partStart += 2;
            }
            else if (rawBuffer[partStart] === 0x0a) {
                partStart += 1;
            }
            const nextPos = rawBuffer.indexOf(delimiterBoundary, partStart);
            if (nextPos === -1)
                break;
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
                            throw new common_1.BadRequestException(`فیلد فایل ارسالی (${fieldName}) مجاز نیست`);
                        }
                        if (files.length >= maxFiles) {
                            throw new common_1.BadRequestException(`حداکثر تعداد فایل مجاز ${maxFiles} عدد است`);
                        }
                        if (bodySlice.length > maxFileSize) {
                            const maxMb = Math.round((maxFileSize / (1024 * 1024)) * 10) / 10;
                            throw new common_1.BadRequestException(`حجم هر فایل نباید بیشتر از ${maxMb} مگابایت باشد`);
                        }
                        const safeOriginalName = sanitizeOriginalFilename(fileName);
                        const rawExt = (0, path_1.extname)(safeOriginalName).toLowerCase();
                        const safeExt = rawExt.replace(/[^a-z0-9.]/g, '').slice(0, 12);
                        if (options.allowedMimeTypes && !options.allowedMimeTypes.has(partMime)) {
                            throw new common_1.BadRequestException(options.invalidFileMessage ?? 'فرمت فایل مجاز نیست');
                        }
                        if (options.allowedExtensions && !options.allowedExtensions.has(safeExt)) {
                            throw new common_1.BadRequestException(options.invalidFileMessage ?? 'فرمت فایل مجاز نیست');
                        }
                        const fileBuffer = Buffer.from(bodySlice);
                        const storedFilename = `${(0, crypto_1.randomUUID)()}${safeExt}`;
                        let destinationDir = '';
                        let storedPath = '';
                        if (options.destination) {
                            destinationDir = options.destination;
                            storedPath = (0, path_1.join)(options.destination, storedFilename);
                            await fs_1.promises.writeFile(storedPath, fileBuffer);
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
                }
                else if (fieldName) {
                    // Regular form field
                    if (bodySlice.length > maxFieldSize) {
                        throw new common_1.BadRequestException('حجم اطلاعات متنی فرم بیش از حد مجاز است');
                    }
                    fields[fieldName] = bodySlice.toString('utf8');
                }
            }
            // Move to the `--` of `\r\n--boundary`
            pos = nextPos + 2;
        }
    }
    catch (error) {
        await cleanupSavedFiles(files);
        throw error;
    }
    return { fields, files };
}
let MultipartUploadInterceptor = class MultipartUploadInterceptor {
    constructor(options = {}) {
        this.options = options;
    }
    async intercept(context, next) {
        const req = context.switchToHttp().getRequest();
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
        }
        else {
            req.uploadedFiles = [];
            req.uploadedFile = undefined;
        }
        return next.handle();
    }
};
exports.MultipartUploadInterceptor = MultipartUploadInterceptor;
exports.MultipartUploadInterceptor = MultipartUploadInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], MultipartUploadInterceptor);
exports.UploadedMultipartFiles = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.uploadedFiles ?? [];
});
exports.UploadedMultipartFile = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.uploadedFile;
});
