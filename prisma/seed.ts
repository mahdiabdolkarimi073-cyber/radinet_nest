import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Categories
  const imaging = await prisma.shopCategory.upsert({
    where: { slug: 'imaging-equipment' },
    update: {},
    create: {
      name: 'دستگاه‌های تصویربرداری',
      slug: 'imaging-equipment',
      description: 'دستگاه‌های MRI، CT، اولتراسوند و رادیولوژی',
      iconKey: 'imaging-equipment',
      colorTheme: 'blue',
      displayOrder: 0,
    },
  });

  const accessories = await prisma.shopCategory.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'تجهیزات و لوازم جانبی',
      slug: 'accessories',
      description: 'کویل‌ها، کابل‌ها و لوازم جانبی دستگاه‌های تصویربرداری',
      iconKey: 'accessories',
      colorTheme: 'green',
      displayOrder: 1,
    },
  });

  const consumables = await prisma.shopCategory.upsert({
    where: { slug: 'consumables' },
    update: {},
    create: {
      name: 'مواد و لوازم مصرفی',
      slug: 'consumables',
      description: 'مواد مصرفی تصویربرداری و یک‌بار مصرف',
      iconKey: 'consumables',
      colorTheme: 'orange',
      displayOrder: 2,
    },
  });

  const media = await prisma.shopCategory.upsert({
    where: { slug: 'imaging-media' },
    update: {},
    create: {
      name: 'فیلم و مدیای تصویربرداری',
      slug: 'imaging-media',
      description: 'فیلم‌های رادیولوژی و مدیای ذخیره‌سازی تصاویر',
      iconKey: 'imaging-media',
      colorTheme: 'blue',
      displayOrder: 3,
    },
  });

  // Products
  const products = [
    {
      name: 'دستگاه تصویربرداری MRI ۱.۵ تسلا',
      slug: 'mri-1-5-tesla',
      shortDescription: 'دستگاه MRI با میدان ۱.۵ تسلا مناسب مراکز تخصصی',
      categoryId: imaging.id,
      brand: 'سیمنس',
      sku: 'MRI-15T-001',
      price: 185000000,
      oldPrice: 210000000,
      discountPercent: 12,
      stock: 3,
      isFeatured: true,
      imageUrl: 'https://images.pexels.com/photos/13176356/pexels-photo-13176356.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    },
    {
      name: 'کابل کویل تصویربرداری',
      slug: 'coil-cable',
      shortDescription: 'کابل اتصال کویل دستگاه تصویربرداری',
      categoryId: accessories.id,
      brand: 'فیلیپس',
      sku: 'ACC-CBL-002',
      price: 2450000,
      stock: 25,
      isFeatured: true,
      imageUrl: 'https://images.pexels.com/photos/13704354/pexels-photo-13704354.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    },
    {
      name: 'سیستم تفسیر رادیولوژی',
      slug: 'radiology-workstation',
      shortDescription: 'ایستگاه کاری تفسیر تصاویر رادیولوژی',
      categoryId: imaging.id,
      brand: 'ج‌ای',
      sku: 'SYS-WS-003',
      price: 98000000,
      oldPrice: 112000000,
      discountPercent: 13,
      stock: 5,
      isFeatured: true,
      imageUrl: 'https://images.pexels.com/photos/9951387/pexels-photo-9951387.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    },
    {
      name: 'ست تجهیزات پشتیبانی بالینی',
      slug: 'clinical-support-kit',
      shortDescription: 'ست کامل تجهیزات پشتیبانی بالینی تصویربرداری',
      categoryId: consumables.id,
      brand: 'رادینت',
      sku: 'CON-KIT-004',
      price: 1890000,
      stock: 40,
      isFeatured: true,
      imageUrl: 'https://images.pexels.com/photos/19601385/pexels-photo-19601385.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    },
  ];

  for (const p of products) {
    await prisma.shopProduct.upsert({
      where: { slug: p.slug },
      update: {},
      create: p as any,
    });
  }

  // Sample discount
  await prisma.shopDiscount.upsert({
    where: { code: 'RADINET10' },
    update: {},
    create: {
      code: 'RADINET10',
      description: 'تخفیف ۱۰ درصدی اولین خرید',
      type: 'percent',
      value: 10,
      isActive: true,
    },
  });

  // Shipping methods
  const shippingMethods = [
    { code: 'post', name: 'پست پیشتاز', price: 80000, estimatedDays: '۳ تا ۵ روز', iconKey: 'post', displayOrder: 0 },
    { code: 'tipax', name: 'تیپاکس', price: 300000, estimatedDays: '۲ تا ۳ روز', iconKey: 'tipax', displayOrder: 1 },
    { code: 'bar', name: 'باربری', price: 250000, estimatedDays: '۳ تا ۷ روز', iconKey: 'bar', displayOrder: 2 },
    { code: 'express', name: 'ارسال اکسپرس', price: 0, estimatedDays: '۲۴ ساعت', iconKey: 'express', displayOrder: 3 },
  ];
  for (const sm of shippingMethods) {
    await prisma.shopShippingMethod.upsert({
      where: { code: sm.code },
      update: {},
      create: sm as any,
    });
  }

  console.log('Shop seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
