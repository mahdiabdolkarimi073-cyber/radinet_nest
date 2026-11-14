import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('🚀 [Radinet Migration] شروع مهاجرت داده‌های JSON به PostgreSQL');
  console.log('============================================================');

  const backupFile = path.resolve(__dirname, 'radinet_db_backup.json');
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ فایل پشتیبان در مسیر ${backupFile} یافت نشد.`);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log('✅ فایل پشتیبان radinet_db_backup.json با موفقیت بارگذاری شد.');

  // Map to translate legacy non-UUID IDs to valid PostgreSQL UUIDs
  const userMap = new Map<string, string>(); // oldUserId -> newUuid
  const categoryMap = new Map<string, string>(); // oldCatId -> newUuid

  // 1. Migrate Users
  console.log('\n--- ۱. مهاجرت کاربران ---');
  const defaultPasswordHash = await bcrypt.hash('Radinet@User2025!', 10);
  const users = Array.isArray(db.users) ? db.users : [];
  for (const u of users) {
    const email = (u.email || '').trim().toLowerCase();
    if (!email) continue;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      userMap.set(u.id, existing.id);
      console.log(`کاربر موجود: ${email} -> ${existing.id}`);
    } else {
      const created = await prisma.user.create({
        data: {
          fullName: u.fullName || u.name || 'کاربر رادینت',
          email,
          passwordHash: defaultPasswordHash,
          role: u.role || 'user',
          status: u.status || 'active',
          country: u.country || 'IR',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        },
      });
      userMap.set(u.id, created.id);
      console.log(`کاربر جدید ایجاد شد: ${email} -> ${created.id}`);
    }
  }

  // 2. Migrate Doctor Profiles
  console.log('\n--- ۲. مهاجرت پروفایل پزشکان ---');
  const doctorProfiles = Array.isArray(db.doctorProfiles) ? db.doctorProfiles : [];
  for (const doc of doctorProfiles) {
    const email = (doc.email || '').trim().toLowerCase();
    const mappedUserId = userMap.get(doc.userId);
    let targetUser: any = null;

    if (mappedUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: mappedUserId } });
    }
    if (!targetUser && email) {
      targetUser = await prisma.user.findUnique({ where: { email } });
    }
    if (!targetUser && email) {
      targetUser = await prisma.user.create({
        data: {
          fullName: doc.fullName || 'دکتر رادیولوژیست',
          email,
          passwordHash: defaultPasswordHash,
          role: 'radiologist',
          status: 'active',
          country: 'IR',
        },
      });
      userMap.set(doc.userId, targetUser.id);
    }

    if (targetUser) {
      await prisma.doctorProfile.upsert({
        where: { userId: targetUser.id },
        update: {
          fullName: doc.fullName || targetUser.fullName,
          specialty: doc.specialty || 'متخصص رادیولوژی و تله‌ریپورت',
          subSpecialty: doc.subSpecialty || null,
          licenseNumber: doc.licenseNumber || null,
          biography: doc.biography || '',
          education: doc.education || '',
          certifications: doc.certifications || '',
          experienceYears: Number(doc.experienceYears) || 5,
          languages: doc.languages || 'فارسی',
          workplace: doc.workplace || 'مرکز تله‌رادیولوژی رادینت',
          maxDailyReports: Number(doc.maxDailyReports) || 20,
          tariff: Number(doc.tariff) || 950000,
          isActive: doc.isActive !== false,
          collaborationStatus: doc.collaborationStatus || 'approved',
        },
        create: {
          userId: targetUser.id,
          fullName: doc.fullName || targetUser.fullName,
          email: targetUser.email,
          specialty: doc.specialty || 'متخصص رادیولوژی و تله‌ریپورت',
          subSpecialty: doc.subSpecialty || null,
          licenseNumber: doc.licenseNumber || null,
          biography: doc.biography || '',
          education: doc.education || '',
          certifications: doc.certifications || '',
          experienceYears: Number(doc.experienceYears) || 5,
          languages: doc.languages || 'فارسی',
          workplace: doc.workplace || 'مرکز تله‌رادیولوژی رادینت',
          maxDailyReports: Number(doc.maxDailyReports) || 20,
          tariff: Number(doc.tariff) || 950000,
          isActive: doc.isActive !== false,
          collaborationStatus: doc.collaborationStatus || 'approved',
        },
      });
      console.log(`پروفایل پزشک ثبت/بروزرسانی شد: ${targetUser.fullName}`);
    }
  }

  // 3. Migrate Articles
  console.log('\n--- ۳. مهاجرت مقالات و اخبار ---');
  const articles = Array.isArray(db.articles) ? db.articles : [];
  for (const art of articles) {
    if (!art.slug) continue;
    await prisma.article.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        summary: art.summary,
        content: art.content,
        imageUrl: art.imageUrl || '',
        category: art.category || 'عمومی',
        author: art.author || 'تیم تحریریه رادینت',
        isPublished: art.isPublished !== false,
        publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
      },
      create: {
        title: art.title,
        slug: art.slug,
        summary: art.summary,
        content: art.content,
        imageUrl: art.imageUrl || '',
        category: art.category || 'عمومی',
        author: art.author || 'تیم تحریریه رادینت',
        isPublished: art.isPublished !== false,
        publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
        createdAt: art.createdAt ? new Date(art.createdAt) : new Date(),
      },
    });
    console.log(`مقاله درج شد: ${art.title}`);
  }

  // 4. Migrate About Content & Media
  console.log('\n--- ۴. مهاجرت بخش درباره ما ---');
  const aboutContents = Array.isArray(db.aboutContent) ? db.aboutContent : [];
  for (const c of aboutContents) {
    if (!c.key) continue;
    await prisma.aboutContent.upsert({
      where: { key: c.key },
      update: {
        title: c.title,
        body: c.body,
        isActive: c.isActive !== false,
        displayOrder: c.displayOrder || 0,
      },
      create: {
        key: c.key,
        title: c.title,
        body: c.body,
        isActive: c.isActive !== false,
        displayOrder: c.displayOrder || 0,
      },
    });
  }

  const aboutMedias = Array.isArray(db.aboutMedia) ? db.aboutMedia : [];
  for (const m of aboutMedias) {
    const existing = await prisma.aboutMedia.findFirst({
      where: { title: m.title, kind: m.kind },
    });
    if (!existing) {
      await prisma.aboutMedia.create({
        data: {
          kind: m.kind || 'team',
          title: m.title,
          imageUrl: m.imageUrl,
          displayOrder: m.displayOrder || 0,
          isActive: m.isActive !== false,
        },
      });
    }
  }

  const certificates = Array.isArray(db.certificates) ? db.certificates : [];
  for (const cert of certificates) {
    const existing = await prisma.certificate.findFirst({
      where: { title: cert.title },
    });
    if (!existing) {
      await prisma.certificate.create({
        data: {
          title: cert.title,
          imageUrl: cert.imageUrl,
          fileUrl: cert.fileUrl || null,
          description: cert.description || '',
          displayOrder: cert.displayOrder || 0,
          isActive: cert.isActive !== false,
        },
      });
    }
  }

  // 5. Migrate Contact Page Content & Phones/Emails/Hours
  console.log('\n--- ۵. مهاجرت اطلاعات تماس با ما ---');
  if (db.contactPageContent) {
    const cpc = db.contactPageContent;
    const existing = await prisma.contactPageContent.findFirst();
    if (existing) {
      await prisma.contactPageContent.update({
        where: { id: existing.id },
        data: {
          heroTitle: cpc.hero_title || 'تماس با ما',
          heroSubtitle: cpc.hero_subtitle || '',
          introTitle: cpc.intro_title || '',
          introBody: cpc.intro_body || '',
          officeAddress: cpc.office_address || '',
          latitude: cpc.latitude || null,
          longitude: cpc.longitude || null,
          mapUrl: cpc.map_url || null,
          responseHours: cpc.response_hours || '',
        },
      });
    } else {
      await prisma.contactPageContent.create({
        data: {
          heroTitle: cpc.hero_title || 'تماس با ما',
          heroSubtitle: cpc.hero_subtitle || '',
          introTitle: cpc.intro_title || '',
          introBody: cpc.intro_body || '',
          officeAddress: cpc.office_address || '',
          latitude: cpc.latitude || null,
          longitude: cpc.longitude || null,
          mapUrl: cpc.map_url || null,
          responseHours: cpc.response_hours || '',
        },
      });
    }
  }

  const contactPhones = Array.isArray(db.contactPhoneNumbers) ? db.contactPhoneNumbers : [];
  for (const p of contactPhones) {
    const existing = await prisma.contactPhoneNumber.findFirst({ where: { phone: p.phone } });
    if (!existing) {
      await prisma.contactPhoneNumber.create({
        data: {
          label: p.label || 'پشتیبانی',
          phone: p.phone,
          isActive: p.is_active !== false,
          displayOrder: p.display_order || 0,
        },
      });
    }
  }

  const contactEmails = Array.isArray(db.contactSupportEmails) ? db.contactSupportEmails : [];
  for (const e of contactEmails) {
    const existing = await prisma.contactSupportEmail.findFirst({ where: { email: e.email } });
    if (!existing) {
      await prisma.contactSupportEmail.create({
        data: {
          label: e.label || 'ایمیل پشتیبانی',
          email: e.email,
          isActive: e.is_active !== false,
          displayOrder: e.display_order || 0,
        },
      });
    }
  }

  const contactHours = Array.isArray(db.contactResponseHours) ? db.contactResponseHours : [];
  for (const h of contactHours) {
    const existing = await prisma.contactResponseHour.findFirst({ where: { dayLabel: h.day_label } });
    if (!existing) {
      await prisma.contactResponseHour.create({
        data: {
          dayLabel: h.day_label,
          hours: h.hours,
          isActive: h.is_active !== false,
          displayOrder: h.display_order || 0,
        },
      });
    }
  }

  // 6. Migrate Legal Documents
  console.log('\n--- ۶. مهاجرت اسناد حقوقی و قوانین ---');
  const legalDocs = Array.isArray(db.legalDocuments) ? db.legalDocuments : [];
  for (const l of legalDocs) {
    const existing = await prisma.legalDocument.findFirst({
      where: { documentType: l.documentType || l.type },
    });
    if (!existing) {
      await prisma.legalDocument.create({
        data: {
          documentType: l.documentType || l.type,
          title: l.title,
          content: l.content,
          versionNumber: l.versionNumber || 1,
          isActive: l.isActive !== false,
          effectiveDate: l.effectiveDate ? new Date(l.effectiveDate) : new Date(),
        },
      });
      console.log(`سند حقوقی درج شد: ${l.title}`);
    }
  }

  // 7. Migrate Support FAQs and Contact Info
  console.log('\n--- ۷. مهاجرت سوالات متداول پشتیبانی ---');
  const faqs = Array.isArray(db.supportFaqs) ? db.supportFaqs : [];
  for (const f of faqs) {
    const existing = await prisma.supportFaq.findFirst({
      where: { question: f.question },
    });
    if (!existing) {
      await prisma.supportFaq.create({
        data: {
          question: f.question,
          answer: f.answer,
          category: f.category || 'general',
          displayOrder: f.display_order || 0,
          isPublished: f.is_published !== false,
        },
      });
    }
  }

  if (db.supportContactInfo) {
    const sci = db.supportContactInfo;
    const existing = await prisma.supportContactInfo.findFirst();
    if (existing) {
      await prisma.supportContactInfo.update({
        where: { id: existing.id },
        data: {
          heroTitle: sci.hero_title || 'مرکز پشتیبانی و راهنمایی رادینت',
          heroSubtitle: sci.hero_subtitle || '',
          phoneNumber: sci.phone_number || '۰۲۱-۸۸۸۸۱۹۲۰',
          mobileNumber: sci.mobile_number || '۰۹۱۲۰۵۴۵۶۷۸',
          email: sci.email || 'support@radinet.ir',
          workingHours: sci.working_hours || 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰',
          emergencyNotice: sci.emergency_notice || 'واحد تله‌ریپورت اورژانس ۲۴/۷ فعال است.',
        },
      });
    } else {
      await prisma.supportContactInfo.create({
        data: {
          heroTitle: sci.hero_title || 'مرکز پشتیبانی و راهنمایی رادینت',
          heroSubtitle: sci.hero_subtitle || '',
          phoneNumber: sci.phone_number || '۰۲۱-۸۸۸۸۱۹۲۰',
          mobileNumber: sci.mobile_number || '۰۹۱۲۰۵۴۵۶۷۸',
          email: sci.email || 'support@radinet.ir',
          workingHours: sci.working_hours || 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰',
          emergencyNotice: sci.emergency_notice || 'واحد تله‌ریپورت اورژانس ۲۴/۷ فعال است.',
        },
      });
    }
  }

  // 8. Migrate Shop Categories & Products
  console.log('\n--- ۸. مهاجرت دسته‌بندی‌ها و محصولات فروشگاه ---');
  const shopCategories = Array.isArray(db.shopCategories) ? db.shopCategories : [];
  for (const cat of shopCategories) {
    const slug = cat.slug;
    if (!slug) continue;
    const createdCat = await prisma.shopCategory.upsert({
      where: { slug },
      update: {
        name: cat.name,
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        iconKey: cat.iconKey || 'imaging-equipment',
        colorTheme: cat.colorTheme || 'blue',
        displayOrder: cat.displayOrder || 0,
      },
      create: {
        name: cat.name,
        slug,
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        iconKey: cat.iconKey || 'imaging-equipment',
        colorTheme: cat.colorTheme || 'blue',
        displayOrder: cat.displayOrder || 0,
      },
    });
    categoryMap.set(cat.id, createdCat.id);
  }

  const productMap = new Map<string, string>(); // oldProductId -> newUuid
  const shopProducts = Array.isArray(db.shopProducts) ? db.shopProducts : [];
  for (const prod of shopProducts) {
    const slug = prod.slug;
    if (!slug) continue;
    const categoryId = categoryMap.get(prod.categoryId) || null;
    const savedProd = await prisma.shopProduct.upsert({
      where: { slug },
      update: {
        name: prod.name,
        description: prod.description || '',
        shortDescription: prod.shortDescription || '',
        technicalSpecifications: prod.technicalSpecifications || '',
        categoryId: categoryId ?? undefined,
        brand: prod.brand || 'رادینت',
        sku: prod.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
        price: prod.price || 1000000,
        oldPrice: prod.oldPrice || null,
        discountPercent: prod.discountPercent || 0,
        stock: prod.stock || 10,
        imageUrl: prod.imageUrl || '',
        isFeatured: prod.isFeatured || false,
        isActive: prod.isActive !== false,
      },
      create: {
        name: prod.name,
        slug,
        description: prod.description || '',
        shortDescription: prod.shortDescription || '',
        technicalSpecifications: prod.technicalSpecifications || '',
        categoryId: categoryId ?? undefined,
        brand: prod.brand || 'رادینت',
        sku: prod.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
        price: prod.price || 1000000,
        oldPrice: prod.oldPrice || null,
        discountPercent: prod.discountPercent || 0,
        stock: prod.stock || 10,
        imageUrl: prod.imageUrl || '',
        isFeatured: prod.isFeatured || false,
        isActive: prod.isActive !== false,
      },
    });
    productMap.set(prod.id, savedProd.id);
    if (prod.slug) productMap.set(prod.slug, savedProd.id);
    console.log(`محصول فروشگاه درج شد: ${prod.name}`);
  }

  // 9. Migrate Shop Shipping Methods, Discounts, Orders & Reviews
  console.log('\n--- ۹. مهاجرت روش‌های ارسال، تخفیف‌ها، سفارش‌ها و نظرات فروشگاه ---');
  const shippingMethods = Array.isArray(db.shopShippingMethods) ? db.shopShippingMethods : [];
  for (let idx = 0; idx < shippingMethods.length; idx++) {
    const sm = shippingMethods[idx];
    if (!sm.code) continue;
    await prisma.shopShippingMethod.upsert({
      where: { code: sm.code },
      update: {
        name: sm.name,
        description: sm.description || '',
        price: Number(sm.price) || 0,
        estimatedDays: sm.estimatedDays || null,
        iconKey: sm.iconKey || 'truck',
        isActive: sm.isActive !== false,
        displayOrder: sm.displayOrder ?? idx,
      },
      create: {
        code: sm.code,
        name: sm.name,
        description: sm.description || '',
        price: Number(sm.price) || 0,
        estimatedDays: sm.estimatedDays || null,
        iconKey: sm.iconKey || 'truck',
        isActive: sm.isActive !== false,
        displayOrder: sm.displayOrder ?? idx,
      },
    });
  }

  const shopDiscounts = Array.isArray(db.shopDiscounts) ? db.shopDiscounts : [];
  for (const disc of shopDiscounts) {
    if (!disc.code) continue;
    await prisma.shopDiscount.upsert({
      where: { code: disc.code },
      update: {
        description: disc.description || '',
        type: disc.type || 'percent',
        value: Number(disc.value) || 0,
        minOrderAmount: disc.minOrderAmount != null ? Number(disc.minOrderAmount) : null,
        maxDiscountAmount: disc.maxDiscountAmount != null ? Number(disc.maxDiscountAmount) : null,
        usageLimit: disc.usageLimit ?? null,
        usedCount: disc.usedCount ?? 0,
        isActive: disc.isActive !== false,
      },
      create: {
        code: disc.code,
        description: disc.description || '',
        type: disc.type || 'percent',
        value: Number(disc.value) || 0,
        minOrderAmount: disc.minOrderAmount != null ? Number(disc.minOrderAmount) : null,
        maxDiscountAmount: disc.maxDiscountAmount != null ? Number(disc.maxDiscountAmount) : null,
        usageLimit: disc.usageLimit ?? null,
        usedCount: disc.usedCount ?? 0,
        isActive: disc.isActive !== false,
      },
    });
  }

  const shopOrders = Array.isArray(db.shopOrders) ? db.shopOrders : [];
  for (const ord of shopOrders) {
    if (!ord.orderNumber) continue;
    const existing = await prisma.shopOrder.findUnique({ where: { orderNumber: ord.orderNumber } });
    if (existing) continue;
    const mappedItems = (Array.isArray(ord.items) ? ord.items : [])
      .map((item: any) => {
        const mappedProdId =
          productMap.get(item.productId) ||
          (item.product?.slug ? productMap.get(item.product.slug) : undefined);
        if (!mappedProdId) return null;
        return {
          productId: mappedProdId,
          productName: item.productName || item.product?.name || 'محصول',
          unitPrice: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 1,
          lineTotal: Number(item.lineTotal) || 0,
        };
      })
      .filter(Boolean) as Array<{
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }>;

    await prisma.shopOrder.create({
      data: {
        orderNumber: ord.orderNumber,
        userId: ord.userId ? userMap.get(ord.userId) ?? null : null,
        customerName: ord.customerName || 'مشتری',
        customerPhone: ord.customerPhone || '',
        customerEmail: ord.customerEmail || null,
        shippingAddress: ord.shippingAddress || '',
        notes: ord.notes || null,
        subtotal: Number(ord.subtotal) || 0,
        discountTotal: Number(ord.discountTotal) || 0,
        shippingCost: Number(ord.shippingCost) || 0,
        total: Number(ord.total) || 0,
        status: ord.status || 'pending',
        paymentStatus: ord.paymentStatus || 'unpaid',
        paymentReference: ord.paymentReference || null,
        trackingCode: ord.trackingCode || null,
        province: ord.province || null,
        city: ord.city || null,
        postalCode: ord.postalCode || null,
        shippingMethod: ord.shippingMethod || null,
        shippingMethodName: ord.shippingMethodName || null,
        needInvoice: Boolean(ord.needInvoice),
        paymentMethod: ord.paymentMethod || null,
        createdAt: ord.createdAt ? new Date(ord.createdAt) : new Date(),
        ...(mappedItems.length > 0 ? { items: { create: mappedItems } } : {}),
      },
    });
  }

  const productReviews = Array.isArray(db.productReviews) ? db.productReviews : [];
  const fallbackUser = await prisma.user.findFirst();
  for (const rev of productReviews) {
    const targetId =
      productMap.get(rev.productId) ||
      (rev.productSlug ? productMap.get(rev.productSlug) : undefined) ||
      rev.productId;
    const authorId =
      (rev.userId ? userMap.get(rev.userId) : undefined) ||
      fallbackUser?.id;
    if (!targetId || !authorId || !rev.content) continue;
    const exists = await prisma.review.findFirst({
      where: { targetType: 'product', targetId, content: rev.content },
    });
    if (!exists) {
      await prisma.review.create({
        data: {
          userId: authorId,
          targetType: 'product',
          targetId,
          rating: Number(rev.rating) || 5,
          content: rev.content,
          status: rev.status || 'approved',
          reviewedAt: rev.reviewedAt ? new Date(rev.reviewedAt) : null,
          createdAt: rev.createdAt ? new Date(rev.createdAt) : new Date(),
        },
      });
    }
  }

  // 10. Migrate Imaging Centers, Consultations & Contact Messages
  console.log('\n--- ۱۰. مهاجرت مراکز تصویربرداری، مشاوره‌ها و پیام‌های تماس ---');
  const imagingCenters = Array.isArray(db.imagingCenters) ? db.imagingCenters : [];
  for (let idx = 0; idx < imagingCenters.length; idx++) {
    const ctr = imagingCenters[idx];
    const slug = ctr.slug || `center-${ctr.id || idx + 1}`;
    await prisma.imagingCenter.upsert({
      where: { slug },
      update: { name: ctr.name, city: ctr.city || '' },
      create: {
        name: ctr.name,
        slug,
        city: ctr.city || '',
        isActive: ctr.isActive !== false,
        displayOrder: ctr.displayOrder ?? idx,
      },
    });
  }

  const consultations = Array.isArray(db.consultationRequests) ? db.consultationRequests : [];
  for (const c of consultations) {
    const exists = await prisma.consultationRequest.findFirst({
      where: { name: c.name, phone: c.phone, message: c.message },
    });
    if (!exists) {
      await prisma.consultationRequest.create({
        data: {
          name: c.name || 'متقاضی',
          phone: c.phone || '',
          email: c.email || '',
          message: c.message || '',
          status: c.status || 'new',
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        },
      });
    }
  }

  const contactMessages = Array.isArray(db.contactMessages) ? db.contactMessages : [];
  for (const m of contactMessages) {
    const exists = await prisma.contactMessage.findFirst({
      where: { email: m.email, subject: m.subject },
    });
    if (!exists) {
      await prisma.contactMessage.create({
        data: {
          name: m.name || 'کاربر',
          email: m.email || '',
          phone: m.phone || '',
          subject: m.subject || 'پیام تماس',
          message: m.message || '',
          status: m.status || 'new',
          createdAt: m.created_at || m.createdAt ? new Date(m.created_at || m.createdAt) : new Date(),
        },
      });
    }
  }

  // 11. Migrate TeleReport Requests, Radiology Reports & Tickets
  console.log('\n--- ۱۱. مهاجرت درخواست‌های تله‌ریپورت، گزارش‌ها و تیکت‌ها ---');
  const teleReportMap = new Map<string, string>();
  const teleReportRequests = Array.isArray(db.teleReportRequests) ? db.teleReportRequests : [];
  for (const req of teleReportRequests) {
    if (!req.requestNumber) continue;
    const saved = await prisma.teleReportRequest.upsert({
      where: { requestNumber: req.requestNumber },
      update: {},
      create: {
        requestNumber: req.requestNumber,
        userId: req.userId ? userMap.get(req.userId) ?? null : null,
        country: req.country || 'IR',
        language: req.language || 'fa',
        patientFirstName: req.patientFirstName || 'بیمار',
        patientLastName: req.patientLastName || '',
        nationalId: req.nationalId || null,
        passportNumber: req.passportNumber || null,
        phone: req.phone || '',
        city: req.city || '',
        age: req.age ?? null,
        gender: req.gender || 'male',
        clinicalHistory: req.clinicalHistory || '',
        symptoms: req.symptoms || '',
        imagingType: req.imagingType || 'MRI',
        imagingArea: req.imagingArea || 'عمومی',
        status: req.status || 'new',
        paymentStatus: req.paymentStatus || 'unpaid',
        paymentAmount: Number(req.paymentAmount) || 0,
        createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
      },
    });
    teleReportMap.set(req.id, saved.id);
  }

  const radiologyReports = Array.isArray(db.radiologyReports) ? db.radiologyReports : [];
  for (const rep of radiologyReports) {
    const reqUuid = teleReportMap.get(rep.requestId);
    if (!reqUuid) continue;
    const exists = await prisma.radiologyReport.findFirst({ where: { requestId: reqUuid } });
    if (!exists) {
      await prisma.radiologyReport.create({
        data: {
          requestId: reqUuid,
          authorId: rep.authorId ? userMap.get(rep.authorId) ?? null : null,
          findings: rep.findings || '',
          conclusion: rep.conclusion || '',
          status: rep.status || 'draft',
          signed: Boolean(rep.signed),
          adminApprovalStatus: rep.adminApprovalStatus || 'pending',
          supportApprovalStatus: rep.supportApprovalStatus || 'pending',
          rejectReason: rep.rejectReason || null,
        },
      });
    }
  }

  const legacyTickets = Array.isArray(db.tickets) ? db.tickets : [];
  for (const t of legacyTickets) {
    const trackingCode = t.ticketNumber || t.trackingCode;
    const exists = trackingCode
      ? await prisma.ticket.findUnique({ where: { trackingCode } })
      : await prisma.ticket.findFirst({ where: { subject: t.subject } });
    if (!exists) {
      const firstMsg = Array.isArray(t.messages) && t.messages[0]?.body ? t.messages[0].body : t.message || t.subject;
      await prisma.ticket.create({
        data: {
          trackingCode: trackingCode || undefined,
          subject: t.subject || 'تیکت پشتیبانی',
          message: firstMsg,
          category: t.category || 'general',
          priority: t.priority === 'normal' ? 'medium' : (t.priority || 'medium'),
          status: t.status || 'open',
          userId: t.userId ? userMap.get(t.userId) ?? null : null,
          userName: Array.isArray(t.messages) ? t.messages[0]?.senderName || null : null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        },
      });
    }
  }

  // 12. Migrate AI Settings into site_settings table
  console.log('\n--- ۱۲. مهاجرت تنظیمات هوش مصنوعی ---');
  if (db.aiSettings) {
    const normalizedAi = {
      enabled: Boolean(db.aiSettings.aiAnalysisEnabled ?? true),
      aiAnalysisEnabled: Boolean(db.aiSettings.aiAnalysisEnabled ?? true),
      aiPricingEnabled: Boolean(db.aiSettings.aiPricingEnabled ?? true),
      suggestedPrice: Number(db.aiSettings.suggestedPrice ?? 950000),
      currency: db.aiSettings.currency || 'IRR',
      updatedAt: db.aiSettings.updatedAt || new Date().toISOString(),
    };
    await prisma.siteSetting.upsert({
      where: { settingKey: 'ai_settings' },
      update: { settingValue: normalizedAi },
      create: { settingKey: 'ai_settings', settingValue: normalizedAi },
    });
    await prisma.siteSetting.upsert({
      where: { settingKey: 'ai_analysis_global' },
      update: { settingValue: normalizedAi },
      create: { settingKey: 'ai_analysis_global', settingValue: normalizedAi },
    });
    console.log('تنظیمات ai_settings و ai_analysis_global در جدول site_settings ذخیره شد.');
  }

  console.log('\n============================================================');
  console.log('🎉 مهاجرت کلیه اطلاعات از JSON به ساختار PostgreSQL با موفقیت انجام شد.');
  console.log('============================================================');
}

main()
  .catch((e) => {
    console.error('❌ خطا در فرایند مهاجرت دیتابیس:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
