ALTER TABLE "payments"
ADD COLUMN "reconciliation_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "next_reconcile_at" TIMESTAMP(3),
ADD COLUMN "last_reconciled_at" TIMESTAMP(3),
ADD COLUMN "reconciliation_error" VARCHAR(500);

CREATE INDEX "payments_status_next_reconcile_at_idx"
ON "payments"("status", "next_reconcile_at");
