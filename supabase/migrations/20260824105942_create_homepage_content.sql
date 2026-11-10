/*
# Create public homepage content

1. New Tables
- `home_slides`: hero title, subtitle, description, image, and display order.
- `home_services`: service name, description, icon key, color theme, and display order.
- `home_stats`: dashboard metric label, value, icon key, and display order.
- `home_news`: article title, date label, image, and display order.
- `site_settings`: shared footer and regional settings stored as key/value JSON.

2. Security
- Row Level Security is enabled on every new table.
- Public visitors can read published homepage content through the anon role.
- No public write policies are created; content changes are reserved for a future administrative backend using a privileged server connection.

3. Important Notes
- All tables are intentionally single-tenant because the homepage is public content, not user-owned data.
- The frontend includes safe local defaults so the landing page remains usable while content is being configured.
*/

CREATE TABLE IF NOT EXISTS public.home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  primary_cta text NOT NULL DEFAULT 'خدمات ما',
  secondary_cta text NOT NULL DEFAULT 'درباره ما',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_key text NOT NULL DEFAULT 'services',
  color_theme text NOT NULL DEFAULT 'blue',
  cta_label text NOT NULL DEFAULT 'مشاهده خدمات',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL,
  icon_key text NOT NULL DEFAULT 'activity',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_label text NOT NULL,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published slides" ON public.home_slides;
CREATE POLICY "Public can read published slides" ON public.home_slides FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "Public can read published services" ON public.home_services;
CREATE POLICY "Public can read published services" ON public.home_services FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "Public can read published stats" ON public.home_stats;
CREATE POLICY "Public can read published stats" ON public.home_stats FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "Public can read published news" ON public.home_news;
CREATE POLICY "Public can read published news" ON public.home_news FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS home_slides_display_order_idx ON public.home_slides (display_order);
CREATE INDEX IF NOT EXISTS home_services_display_order_idx ON public.home_services (display_order);
CREATE INDEX IF NOT EXISTS home_stats_display_order_idx ON public.home_stats (display_order);
CREATE INDEX IF NOT EXISTS home_news_display_order_idx ON public.home_news (display_order);

INSERT INTO public.home_slides (title, subtitle, description, image_url, display_order)
SELECT 'رادینت', 'پلتفرم هوشمند خدمات تصویربرداری پزشکی', 'ارائه‌دهنده راهکارهای نوین در حوزه تله‌رادیولوژی، مشاوره تخصصی و فروش تجهیزات و ملزومات تصویربرداری', '/assets/images/hero-radinat-radiology.png.png', 0
WHERE NOT EXISTS (SELECT 1 FROM public.home_slides);

INSERT INTO public.home_services (name, description, icon_key, color_theme, display_order)
SELECT * FROM (VALUES
  ('فروشگاه', 'تجهیزات و ملزومات تصویربرداری', 'store', 'green', 0),
  ('تله‌رپورت', 'ارسال و تفسیر آنلاین تصاویر پزشکی', 'teleradiology', 'lavender', 1),
  ('مشاوره', 'مشاوره تخصصی با رادیولوژیست‌ها', 'consultation', 'peach', 2),
  ('سایر خدمات', 'خدمات تخصصی برند رادینت', 'services', 'blue', 3)
) AS content(name, description, icon_key, color_theme, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.home_services);

INSERT INTO public.home_stats (label, value, icon_key, display_order)
SELECT * FROM (VALUES
  ('تعداد درخواست‌ها', '۳۴,۷۸۹', 'activity', 0),
  ('پزشکان', '۲,۳۴۵', 'users', 1),
  ('مراکز طرف قرارداد', '۵۶۷', 'building', 2),
  ('کاربران فعال', '۱۲,۴۵۶', 'user-check', 3)
) AS content(label, value, icon_key, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.home_stats);

INSERT INTO public.home_news (title, date_label, image_url, display_order)
SELECT * FROM (VALUES
  ('توسعه خدمات تصویربرداری برون‌سپاری', '۱۴۰۳/۰۲/۱۵', '/assets/images/news-1.png.png', 0),
  ('مزایای تله‌رادیولوژی در تشخیص سریع‌تر', '۱۴۰۳/۰۲/۰۷', '/assets/images/news-2.png.png', 1)
) AS content(title, date_label, image_url, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.home_news);

INSERT INTO public.site_settings (setting_key, setting_value)
SELECT 'footer', '{"description":"پلتفرم هوشمند خدمات تصویربرداری پزشکی با هدف ساده‌تر کردن دسترسی به خدمات تخصصی","phone":"۰۲۱-۱۲۳۴۵۶۷۸","email":"info@radinat.com","address":"تهران، خیابان ولیعصر"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE setting_key = 'footer');