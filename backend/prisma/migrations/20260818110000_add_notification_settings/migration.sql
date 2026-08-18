ALTER TABLE "store_settings"
ADD COLUMN "notification_email" VARCHAR(320) NOT NULL DEFAULT 'hello@lumi.com',
ADD COLUMN "order_paid_alerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "low_stock_alerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "low_stock_threshold" INTEGER NOT NULL DEFAULT 10;
