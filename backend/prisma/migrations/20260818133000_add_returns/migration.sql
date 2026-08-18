CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED');

CREATE TABLE "product_returns" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason" VARCHAR(500) NOT NULL,
  "resolution_note" VARCHAR(500),
  "created_by_user_id" UUID NOT NULL,
  "approved_at" TIMESTAMP(3),
  "rejected_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_returns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "product_returns_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "return_items" (
  "id" UUID NOT NULL,
  "return_id" UUID NOT NULL,
  "order_item_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "restocked_quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "return_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "product_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "return_items_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "return_items_restocked_quantity_check" CHECK ("restocked_quantity" >= 0 AND "restocked_quantity" <= "quantity")
);

CREATE INDEX "product_returns_order_id_status_idx" ON "product_returns"("order_id", "status");
CREATE INDEX "product_returns_created_by_user_id_idx" ON "product_returns"("created_by_user_id");
CREATE INDEX "product_returns_status_created_at_idx" ON "product_returns"("status", "created_at");
CREATE UNIQUE INDEX "return_items_return_id_order_item_id_key" ON "return_items"("return_id", "order_item_id");
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");
