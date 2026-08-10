ALTER TABLE "payments"
ADD COLUMN "expires_at" TIMESTAMP(3);

UPDATE "payments"
SET "expires_at" = "created_at" + INTERVAL '30 minutes';

ALTER TABLE "payments"
ALTER COLUMN "expires_at" SET NOT NULL;

CREATE UNIQUE INDEX "payments_order_id_provider_key"
ON "payments"("order_id", "provider");

CREATE INDEX "payments_status_expires_at_idx"
ON "payments"("status", "expires_at");
