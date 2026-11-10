-- AlterTable: Add optional max_order_qty column to shop_products (backward-compatible NULL default)
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "max_order_qty" INTEGER;

-- AlterTable: Ensure support_reviews target_id accepts product UUIDs and slugs without data loss
ALTER TABLE "support_reviews" ALTER COLUMN "target_id" TYPE TEXT USING "target_id"::TEXT;
