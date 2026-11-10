import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as jwt from 'jsonwebtoken';
import { verifyAdminToken, verifyAuthToken } from './auth-token';
import {
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  normalizeMaxOrderQty,
  validateProductImageFile,
  validateProductOrderQuantities,
  validateReviewSubmission,
} from './shop-rules';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

describe('1. Auth Token Verification (auth-token.ts)', () => {
  it('verifies a valid Bearer JWT token and returns user payload', () => {
    const token = jwt.sign(
      { sub: 'user-101', email: 'org@radinet.ir', role: 'ORG_ADMIN', organizationId: 'org-1' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const payload = verifyAuthToken(`Bearer ${token}`);
    assert.equal(payload.userId, 'user-101');
    assert.equal(payload.email, 'org@radinet.ir');
    assert.equal(payload.role, 'ORG_ADMIN');
    assert.equal(payload.organizationId, 'org-1');
  });

  it('rejects missing, invalid, or expired JWT tokens', () => {
    assert.throws(() => verifyAuthToken(undefined), /ارسال نشده است/);
    assert.throws(() => verifyAuthToken('Bearer invalid.token.value'), /توکن نامعتبر/);

    const expiredToken = jwt.sign(
      { sub: 'user-101', email: 'expired@radinet.ir', role: 'user' },
      JWT_SECRET,
      { expiresIn: -10 },
    );
    assert.throws(() => verifyAuthToken(`Bearer ${expiredToken}`), /توکن نامعتبر/);
  });

  it('enforces admin role in verifyAdminToken', () => {
    const userToken = jwt.sign({ sub: 'u-1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ sub: 'a-1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    assert.throws(() => verifyAdminToken(`Bearer ${userToken}`), /فقط برای مدیر کل سامانه مجاز است/);
    const adminPayload = verifyAdminToken(`Bearer ${adminToken}`);
    assert.equal(adminPayload.userId, 'a-1');
    assert.equal(adminPayload.role, 'admin');
  });
});

describe('2. Product Image Upload Validation (validateProductImageFile)', () => {
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);

  it('accepts valid JPG, PNG, and WebP files within 5 MB limit', () => {
    const jpgRes = validateProductImageFile({
      originalname: 'device.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: validJpegBuffer,
    });
    assert.equal(jpgRes.valid, true);
    assert.equal(jpgRes.safeExtension, '.jpg');

    const pngRes = validateProductImageFile({
      originalname: 'device.png',
      mimetype: 'image/png',
      size: 2048,
      buffer: validPngBuffer,
    });
    assert.equal(pngRes.valid, true);
    assert.equal(pngRes.safeExtension, '.png');

    const webpRes = validateProductImageFile({
      originalname: 'device.webp',
      mimetype: 'image/webp',
      size: 2048,
      buffer: validWebpBuffer,
    });
    assert.equal(webpRes.valid, true);
    assert.equal(webpRes.safeExtension, '.webp');
  });

  it('rejects unsupported formats, oversized files (>5MB), and spoofed magic bytes', () => {
    const badMime = validateProductImageFile({
      originalname: 'script.svg',
      mimetype: 'image/svg+xml',
      size: 500,
      buffer: Buffer.from('<svg></svg>'),
    });
    assert.equal(badMime.valid, false);

    const oversized = validateProductImageFile({
      originalname: 'huge.jpg',
      mimetype: 'image/jpeg',
      size: MAX_PRODUCT_IMAGE_SIZE_BYTES + 100,
      buffer: validJpegBuffer,
    });
    assert.equal(oversized.valid, false);
    assert.match(oversized.message ?? '', /حجم تصویر/);

    const spoofed = validateProductImageFile({
      originalname: 'fake.png',
      mimetype: 'image/png',
      size: 100,
      buffer: Buffer.from('not-a-real-png-header-at-all'),
    });
    assert.equal(spoofed.valid, false);
  });
});

describe('3. Per-User Purchase Limit (maxOrderQty) Server-Side Enforcement', () => {
  const sampleProducts = [
    { id: 'prod-limited', name: 'مانیتور بارکو', stock: 10, maxOrderQty: 2, isActive: true },
    { id: 'prod-unlimited', name: 'فیلم رادیولوژی', stock: 20, maxOrderQty: null, isActive: true },
  ];

  it('normalizes maxOrderQty values properly for backward compatibility', () => {
    assert.equal(normalizeMaxOrderQty(null), null);
    assert.equal(normalizeMaxOrderQty(undefined), null);
    assert.equal(normalizeMaxOrderQty(''), null);
    assert.equal(normalizeMaxOrderQty(0), null);
    assert.equal(normalizeMaxOrderQty(-3), null);
    assert.equal(normalizeMaxOrderQty(3), 3);
    assert.equal(normalizeMaxOrderQty('4'), 4);
  });

  it('allows ordering up to maxOrderQty and multiple distinct products', () => {
    const res = validateProductOrderQuantities(
      [
        { productId: 'prod-limited', quantity: 2 },
        { productId: 'prod-unlimited', quantity: 15 },
      ],
      sampleProducts,
    );
    assert.equal(res.valid, true);
    assert.equal(res.aggregatedItems.length, 2);
  });

  it('rejects single item exceeding maxOrderQty', () => {
    const res = validateProductOrderQuantities(
      [{ productId: 'prod-limited', quantity: 3 }],
      sampleProducts,
    );
    assert.equal(res.valid, false);
    assert.match(res.message ?? '', /حداکثر تعداد مجاز خرید/);
  });

  it('aggregates duplicate productId rows to prevent API payload bypass of maxOrderQty', () => {
    const res = validateProductOrderQuantities(
      [
        { productId: 'prod-limited', quantity: 1 },
        { productId: 'prod-limited', quantity: 2 },
      ],
      sampleProducts,
    );
    assert.equal(res.valid, false);
    assert.match(res.message ?? '', /حداکثر تعداد مجاز خرید/);
  });
});

describe('4. Product Review Validation & Anti-Spam Rules', () => {
  it('validates review rating, length, XSS tags, and duplicate spam', () => {
    const valid = validateReviewSubmission({
      rating: 5,
      content: 'کیفیت دستگاه بسیار عالی و دقیق است.',
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.rating, 5);

    const badRating = validateReviewSubmission({
      rating: 6,
      content: 'نظر تستی',
    });
    assert.equal(badRating.valid, false);

    const xssAttempt = validateReviewSubmission({
      rating: 4,
      content: '<script>alert(1)</script>خیلی خوب',
    });
    assert.equal(xssAttempt.valid, false);

    const duplicateAttempt = validateReviewSubmission({
      rating: 5,
      content: 'کیفیت دستگاه بسیار عالی و دقیق است.',
      existingUserProductReviews: [
        { content: 'کیفیت دستگاه بسیار عالی و دقیق است.', status: 'pending' },
      ],
    });
    assert.equal(duplicateAttempt.valid, false);
    assert.match(duplicateAttempt.message ?? '', /قبلاً همین نظر/);
  });
});
