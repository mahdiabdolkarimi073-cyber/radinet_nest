-- AlterTable tele_report_requests
ALTER TABLE "tele_report_requests"
  ADD COLUMN IF NOT EXISTS "assigned_doctor_id" UUID,
  ADD COLUMN IF NOT EXISTS "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS "payment_amount" DECIMAL(14,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payment_reference" TEXT,
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "ai_analysis_result" JSONB,
  ADD COLUMN IF NOT EXISTS "ai_suggested_price" DECIMAL(14,0),
  ADD COLUMN IF NOT EXISTS "ai_confirmed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "tele_report_requests_idempotency_key_key" ON "tele_report_requests"("idempotency_key");
CREATE INDEX IF NOT EXISTS "tele_report_requests_assigned_doctor_id_idx" ON "tele_report_requests"("assigned_doctor_id");

-- AlterTable radiology_reports
ALTER TABLE "radiology_reports"
  ADD COLUMN IF NOT EXISTS "admin_approval_status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "support_approval_status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "reject_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approval_logs" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "ai_assistant_draft" JSONB;

-- AlterTable info_requests
ALTER TABLE "info_requests"
  ADD COLUMN IF NOT EXISTS "messages" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "follow_up_status" TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS "admin_note" TEXT,
  ADD COLUMN IF NOT EXISTS "admin_logs" JSONB NOT NULL DEFAULT '[]';
