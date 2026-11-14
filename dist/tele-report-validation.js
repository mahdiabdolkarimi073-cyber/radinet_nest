"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDigits = normalizeDigits;
exports.parseValidatedAge = parseValidatedAge;
exports.parseOptionalNonNegativeNumber = parseOptionalNonNegativeNumber;
exports.parseOptionalValidDate = parseOptionalValidDate;
exports.cleanupUploadedFiles = cleanupUploadedFiles;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normalizeDigits(raw) {
    return raw
        .replace(/[۰-۹]/g, (ch) => String(PERSIAN_DIGITS.indexOf(ch)))
        .replace(/[٠-٩]/g, (ch) => String(ARABIC_DIGITS.indexOf(ch)));
}
function parseValidatedAge(raw, options) {
    if (raw === undefined || raw === null) {
        if (options.required) {
            throw new common_1.BadRequestException('سن بیمار الزامی است و باید یک عدد صحیح بین ۰ تا ۱۳۰ سال باشد');
        }
        return null;
    }
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
            throw new common_1.BadRequestException('سن بیمار باید یک عدد صحیح معتبر باشد');
        }
        if (raw < 0) {
            throw new common_1.BadRequestException('سن بیمار نمی‌تواند منفی باشد');
        }
        if (raw > 130) {
            throw new common_1.BadRequestException('سن بیمار باید بین ۰ تا ۱۳۰ سال باشد');
        }
        return raw;
    }
    if (typeof raw === 'string') {
        const normalized = normalizeDigits(raw).trim();
        if (!normalized) {
            if (options.required) {
                throw new common_1.BadRequestException('سن بیمار الزامی است و باید یک عدد صحیح بین ۰ تا ۱۳۰ سال باشد');
            }
            return null;
        }
        if (!/^[+-]?\d+$/.test(normalized)) {
            throw new common_1.BadRequestException('سن بیمار باید یک عدد صحیح معتبر باشد (اعشار یا حروف مجاز نیست)');
        }
        const parsed = Number.parseInt(normalized, 10);
        if (!Number.isSafeInteger(parsed)) {
            throw new common_1.BadRequestException('سن بیمار معتبر نیست');
        }
        if (parsed < 0) {
            throw new common_1.BadRequestException('سن بیمار نمی‌تواند منفی باشد');
        }
        if (parsed > 130) {
            throw new common_1.BadRequestException('سن بیمار باید بین ۰ تا ۱۳۰ سال باشد');
        }
        return parsed;
    }
    throw new common_1.BadRequestException('فرمت سن بیمار نامعتبر است');
}
function parseOptionalNonNegativeNumber(raw, fieldLabel) {
    if (raw === undefined || raw === null) {
        return null;
    }
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw)) {
            throw new common_1.BadRequestException(`${fieldLabel} باید یک عدد معتبر باشد`);
        }
        if (raw < 0) {
            throw new common_1.BadRequestException(`${fieldLabel} نمی‌تواند منفی باشد`);
        }
        return raw;
    }
    if (typeof raw === 'string') {
        const normalized = normalizeDigits(raw).replace(/[,٬\s]/g, '').trim();
        if (!normalized) {
            return null;
        }
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
            throw new common_1.BadRequestException(`${fieldLabel} باید یک عدد معتبر باشد`);
        }
        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) {
            throw new common_1.BadRequestException(`${fieldLabel} باید یک عدد معتبر باشد`);
        }
        if (parsed < 0) {
            throw new common_1.BadRequestException(`${fieldLabel} نمی‌تواند منفی باشد`);
        }
        return parsed;
    }
    throw new common_1.BadRequestException(`فرمت ${fieldLabel} نامعتبر است`);
}
function jalaliToGregorianDate(jy, jm, jd) {
    if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1) {
        return null;
    }
    const isLeap = (((jy - 474) % 2820) + 2820) % 2820 % 4 === 0;
    const maxDay = jm <= 6 ? 31 : jm <= 11 ? 30 : isLeap ? 30 : 29;
    if (jd > maxDay) {
        return null;
    }
    const gyBase = jy > 979 ? 1600 : 621;
    const adjJy = jy > 979 ? jy - 979 : jy;
    let days = 365 * adjJy +
        Math.floor(adjJy / 33) * 8 +
        Math.floor(((adjJy % 33) + 3) / 4) +
        78 +
        jd +
        (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = gyBase + 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365)
            days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    let gd = days + 1;
    const salA = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 0; gm < 13; gm++) {
        const v = salA[gm];
        if (gd <= v)
            break;
        gd -= v;
    }
    return new Date(Date.UTC(gy, gm - 1, gd));
}
function parseOptionalValidDate(raw, fieldLabel) {
    if (raw === undefined || raw === null) {
        return null;
    }
    if (raw instanceof Date) {
        if (Number.isNaN(raw.getTime())) {
            throw new common_1.BadRequestException(`${fieldLabel} معتبر نیست`);
        }
        return raw;
    }
    if (typeof raw !== 'string') {
        throw new common_1.BadRequestException(`فرمت ${fieldLabel} نامعتبر است`);
    }
    const normalized = normalizeDigits(raw).trim();
    if (!normalized) {
        return null;
    }
    const jalaliMatch = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(normalized);
    if (jalaliMatch) {
        const year = Number.parseInt(jalaliMatch[1], 10);
        const month = Number.parseInt(jalaliMatch[2], 10);
        const day = Number.parseInt(jalaliMatch[3], 10);
        if (year >= 1300 && year <= 1500) {
            const converted = jalaliToGregorianDate(year, month, day);
            if (!converted) {
                throw new common_1.BadRequestException(`${fieldLabel} معتبر نیست`);
            }
            return converted;
        }
    }
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        throw new common_1.BadRequestException(`فرمت ${fieldLabel} معتبر نیست`);
    }
    return parsed;
}
async function cleanupUploadedFiles(files) {
    if (!files || files.length === 0)
        return;
    await Promise.all(files.map(async (f) => {
        if (!f.path)
            return;
        try {
            await fs_1.promises.unlink(f.path);
        }
        catch {
            // Ignore cleanup failures
        }
    }));
}
