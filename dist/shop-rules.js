"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PRODUCT_IMAGE_SIZE_BYTES = exports.MAX_IMAGE_SIZE_BYTES = exports.ALLOWED_IMAGE_EXTS = exports.ALLOWED_IMAGE_MIMES = void 0;
exports.validateProductImageFile = validateProductImageFile;
exports.normalizeMaxOrderQty = normalizeMaxOrderQty;
exports.validateProductOrderQuantities = validateProductOrderQuantities;
exports.validateReviewSubmission = validateReviewSubmission;
const path_1 = require("path");
exports.ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]);
exports.ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
exports.MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
exports.MAX_PRODUCT_IMAGE_SIZE_BYTES = exports.MAX_IMAGE_SIZE_BYTES;
function validateProductImageFile(file) {
    if (!file) {
        const msg = 'فایل تصویر ارسال نشده است.';
        return { valid: false, error: msg, message: msg };
    }
    const size = file.size ?? file.buffer?.length ?? 0;
    if (size <= 0) {
        const msg = 'فایل تصویر خالی است.';
        return { valid: false, error: msg, message: msg };
    }
    if (size > exports.MAX_IMAGE_SIZE_BYTES) {
        const msg = 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    const mime = (file.mimetype || '').toLowerCase().trim();
    const rawExt = (0, path_1.extname)(file.originalname || '').toLowerCase();
    if (!exports.ALLOWED_IMAGE_MIMES.has(mime) && !exports.ALLOWED_IMAGE_EXTS.has(rawExt)) {
        const msg = 'فرمت تصویر نامعتبر است. فقط فرمت‌های JPG، PNG و WebP مجاز هستند.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    // Verify magic bytes if buffer is present
    if (file.buffer) {
        if (file.buffer.length < 12) {
            const msg = 'محتوای فایل تصویر معتبر نیست. لطفاً یک فایل JPG، PNG یا WebP واقعی انتخاب کنید.';
            return { valid: false, error: msg, message: msg };
        }
        const b = file.buffer;
        const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
        const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
        const isWebp = b[0] === 0x52 &&
            b[1] === 0x49 &&
            b[2] === 0x46 &&
            b[3] === 0x46 &&
            b[8] === 0x57 &&
            b[9] === 0x45 &&
            b[10] === 0x42 &&
            b[11] === 0x50;
        if (!isJpeg && !isPng && !isWebp) {
            const msg = 'محتوای فایل تصویر معتبر نیست. لطفاً یک فایل JPG، PNG یا WebP واقعی انتخاب کنید.';
            return {
                valid: false,
                error: msg,
                message: msg,
            };
        }
        if (isJpeg)
            return { valid: true, ext: '.jpg', safeExtension: '.jpg', mimeType: 'image/jpeg' };
        if (isPng)
            return { valid: true, ext: '.png', safeExtension: '.png', mimeType: 'image/png' };
        if (isWebp)
            return { valid: true, ext: '.webp', safeExtension: '.webp', mimeType: 'image/webp' };
    }
    let normalizedExt = '.jpg';
    if (mime === 'image/png' || rawExt === '.png')
        normalizedExt = '.png';
    else if (mime === 'image/webp' || rawExt === '.webp')
        normalizedExt = '.webp';
    return {
        valid: true,
        ext: normalizedExt,
        safeExtension: normalizedExt,
        mimeType: normalizedExt === '.png'
            ? 'image/png'
            : normalizedExt === '.webp'
                ? 'image/webp'
                : 'image/jpeg',
    };
}
function normalizeMaxOrderQty(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0)
        return null;
    return Math.floor(num);
}
/**
 * Validates cart or order items against per-product maxOrderQty and stock limits.
 * Aggregates duplicate product entries so users cannot bypass limits by splitting quantities across rows.
 */
function validateProductOrderQuantities(items, products) {
    if (!Array.isArray(items) || items.length === 0) {
        const msg = 'سبد خرید خالی است.';
        return {
            valid: false,
            code: 'EMPTY_CART',
            error: msg,
            message: msg,
            aggregatedItems: [],
        };
    }
    const productByIdOrSlug = new Map();
    for (const p of products) {
        productByIdOrSlug.set(p.id, p);
        if (p.slug)
            productByIdOrSlug.set(p.slug, p);
    }
    const aggregated = new Map();
    for (const rawItem of items) {
        if (!rawItem || !rawItem.productId) {
            const msg = 'شناسه محصول نامعتبر است.';
            return {
                valid: false,
                code: 'PRODUCT_NOT_FOUND',
                error: msg,
                message: msg,
                aggregatedItems: [],
            };
        }
        const qty = Number(rawItem.quantity);
        if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
            const msg = 'تعداد محصول باید یک عدد صحیح بزرگ‌تر از صفر باشد.';
            return {
                valid: false,
                code: 'INVALID_QTY',
                productId: rawItem.productId,
                error: msg,
                message: msg,
                aggregatedItems: [],
            };
        }
        const product = productByIdOrSlug.get(rawItem.productId);
        if (!product || product.isActive === false) {
            const msg = 'محصول مورد نظر یافت نشد.';
            return {
                valid: false,
                code: 'PRODUCT_NOT_FOUND',
                productId: rawItem.productId,
                error: msg,
                message: msg,
                aggregatedItems: [],
            };
        }
        const prev = aggregated.get(product.id);
        const nextQty = (prev?.quantity ?? 0) + qty;
        aggregated.set(product.id, { product, quantity: nextQty });
    }
    const aggregatedQuantities = new Map();
    const aggregatedItems = [];
    for (const [productId, { product, quantity }] of aggregated.entries()) {
        aggregatedQuantities.set(productId, quantity);
        aggregatedItems.push({ productId, quantity });
        const limit = normalizeMaxOrderQty(product.maxOrderQty);
        if (limit !== null && quantity > limit) {
            const msg = `حداکثر تعداد مجاز خرید برای محصول «${product.name}» ${limit} عدد است.`;
            return {
                valid: false,
                code: 'MAX_ORDER_QTY_EXCEEDED',
                productId,
                maxOrderQty: limit,
                error: msg,
                message: msg,
                aggregatedItems: [],
            };
        }
        if (product.stock < quantity) {
            const msg = `موجودی کالای «${product.name}» کافی نیست (موجودی فعلی: ${product.stock} عدد).`;
            return {
                valid: false,
                code: 'INSUFFICIENT_STOCK',
                productId,
                stock: product.stock,
                error: msg,
                message: msg,
                aggregatedItems: [],
            };
        }
    }
    return {
        valid: true,
        aggregatedQuantities,
        aggregatedItems,
    };
}
function validateReviewSubmission(input) {
    if (typeof input.content !== 'string') {
        const msg = 'متن نظر الزامی است.';
        return { valid: false, error: msg, message: msg };
    }
    const trimmed = input.content.trim();
    if (trimmed.length < 3) {
        const msg = 'متن نظر باید حداقل ۳ کاراکتر باشد.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    if (trimmed.length > 2000) {
        const msg = 'متن نظر نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    // Reject HTML / script injection patterns
    const dangerousPattern = /<\s*script|javascript:|onerror\s*=|onload\s*=/i;
    if (dangerousPattern.test(trimmed)) {
        const msg = 'متن نظر حاوی کاراکترها یا تگ‌های غیرمجاز است.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    const sanitizedContent = trimmed.replace(/[<>]/g, '');
    if (sanitizedContent.length < 3) {
        const msg = 'متن نظر معتبر نیست.';
        return {
            valid: false,
            error: msg,
            message: msg,
        };
    }
    let rating = 5;
    if (input.rating !== undefined && input.rating !== null && input.rating !== '') {
        const parsedRating = Number(input.rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            const msg = 'امتیاز نظر باید عددی بین ۱ تا ۵ باشد.';
            return {
                valid: false,
                error: msg,
                message: msg,
            };
        }
        rating = parsedRating;
    }
    const existingList = input.existingUserProductReviews ?? input.existingUserReviewsForProduct;
    if (Array.isArray(existingList)) {
        const normalizedNew = sanitizedContent.toLowerCase();
        let pendingCount = 0;
        for (const rev of existingList) {
            if ((rev.content || '').trim().toLowerCase() === normalizedNew) {
                const msg = 'شما قبلاً همین نظر را برای این محصول ثبت کرده‌اید.';
                return {
                    valid: false,
                    error: msg,
                    message: msg,
                };
            }
            if (rev.status === 'pending') {
                pendingCount += 1;
            }
        }
        if (pendingCount >= 3) {
            const msg = 'شما ۳ نظر در انتظار بررسی برای این محصول دارید. لطفاً تا زمان بررسی آن‌ها صبر کنید.';
            return {
                valid: false,
                error: msg,
                message: msg,
            };
        }
    }
    return {
        valid: true,
        sanitizedContent,
        rating,
    };
}
