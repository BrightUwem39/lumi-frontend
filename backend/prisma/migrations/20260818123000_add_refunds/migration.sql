CREATE TYPE "RefundStatus" AS ENUM (
  'REQUESTING',
  'PENDING',
  'PROCESSING',
  'NEEDS_ATTENTION',
  'PROCESSED',
  'FAILED'
);

CREATE TABLE "refunds" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "provider_refund_id" VARCHAR(100),
  "provider_refund_reference" VARCHAR(200),
  "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTING',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "initiated_by_user_id" UUID NOT NULL,
  "provider_metadata" JSONB,
  "failure_reason" VARCHAR(500),
  "expected_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "refunds_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "refunds_provider_refund_id_key" ON "refunds"("provider_refund_id");
CREATE UNIQUE INDEX "refunds_provider_refund_reference_key" ON "refunds"("provider_refund_reference");
CREATE INDEX "refunds_payment_id_status_idx" ON "refunds"("payment_id", "status");
CREATE INDEX "refunds_status_created_at_idx" ON "refunds"("status", "created_at");
CREATE INDEX "refunds_initiated_by_user_id_idx" ON "refunds"("initiated_by_user_id");
