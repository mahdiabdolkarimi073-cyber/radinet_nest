import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvironment(): void {
  const envCandidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      try {
        const raw = fs.readFileSync(envFile, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // ignore read error
      }
      break;
    }
  }
}

async function main(): Promise<void> {
  loadEnvironment();

  const email = (process.env.ADMIN_EMAIL?.trim() || 'admin@radinet24.com').toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD?.trim() || 'Radinet@Admin2025!';
  const fullName = process.env.ADMIN_NAME?.trim() || 'مدیر سامانه رادینت';
  const role = process.env.ADMIN_ROLE?.trim() || 'admin';
  const status = 'active';

  console.log('============================================================');
  console.log('🚀 [Radinet Admin Seed] شروع فرایند ایجاد/ارتقای حساب مدیر سیستم');
  console.log('============================================================');
  console.log(`- ایمیل مدیر: ${email}`);
  console.log(`- نام کامل: ${fullName}`);
  console.log(`- نقش سیستمی: ${role}`);
  console.log(`- وضعیت حساب: ${status}`);

  if (!process.env.ADMIN_PASSWORD) {
    console.log('⚠️ هشدار: متغیر محیطی ADMIN_PASSWORD مشخص نشده است؛ از رمز عبور پیش‌فرض استفاده می‌شود.');
  }

  const prisma = new PrismaClient();

  try {
    // Migrate any previous super_admin or SUPERADMIN to admin
    await prisma.user.updateMany({
      where: {
        role: { in: ['super_admin', 'SUPERADMIN', 'SUPER_ADMIN'] },
      },
      data: {
        role: 'admin',
      },
    });

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`[Seed] کاربر با ایمیل ${email} از قبل وجود دارد. به‌روزرسانی به نقش admin و فعال‌سازی...`);
      const updated = await prisma.user.update({
        where: { email },
        data: {
          fullName,
          role,
          status,
          passwordHash,
          country: 'IR',
          updatedAt: new Date(),
        },
      });

      console.log('✅ حساب مدیر ارشد با موفقیت به‌روزرسانی شد:');
      console.log(`   - شناسه: ${updated.id}`);
      console.log(`   - ایمیل: ${updated.email}`);
      console.log(`   - نقش: ${updated.role}`);
      console.log(`   - وضعیت: ${updated.status}`);
    } else {
      console.log(`[Seed] دیتابیس فاقد این حساب است. ایجاد حساب جدید با دسترسی کامل مدیر ارشد...`);
      const created = await prisma.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          role,
          status,
          country: 'IR',
        },
      });

      console.log('✅ حساب مدیر ارشد رادینت با موفقیت ایجاد شد:');
      console.log(`   - شناسه: ${created.id}`);
      console.log(`   - ایمیل: ${created.email}`);
      console.log(`   - نقش: ${created.role}`);
      console.log(`   - وضعیت: ${created.status}`);
    }

    console.log('============================================================');
    console.log('🎉 عملیات با موفقیت پایان یافت.');
    console.log('مسیر ورود: https://radinet24.com/auth');
    console.log('پس از ورود، سیستم شما را خودکار به پنل مدیریت مرکزی /admin هدایت می‌کند.');
    console.log('============================================================');
  } catch (error: any) {
    console.error('❌ خطا در ارتباط با دیتابیس یا اجرای کوئری Prisma:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
