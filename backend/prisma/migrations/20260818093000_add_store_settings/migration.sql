CREATE TABLE "store_settings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'primary',
    "store_name" VARCHAR(100) NOT NULL DEFAULT 'Lumi',
    "tagline" VARCHAR(200) NOT NULL DEFAULT 'Clothes for real days, made with a little more thought.',
    "support_email" VARCHAR(320) NOT NULL DEFAULT 'hello@lumi.com',
    "support_phone" VARCHAR(32) NOT NULL DEFAULT '+2348005864000',
    "address_line" VARCHAR(250) NOT NULL DEFAULT '18 Kingsway',
    "city" VARCHAR(100) NOT NULL DEFAULT 'Lagos',
    "country_code" CHAR(2) NOT NULL DEFAULT 'NG',
    "default_currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
