CREATE TABLE "admin_notification_states" (
  "notification_key" VARCHAR(160) NOT NULL,
  "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dismissed_by_user_id" UUID NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_notification_states_pkey" PRIMARY KEY ("notification_key"),
  CONSTRAINT "admin_notification_states_dismissed_by_user_id_fkey" FOREIGN KEY ("dismissed_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "admin_notification_states_dismissed_by_user_id_dismissed_at_idx" ON "admin_notification_states"("dismissed_by_user_id", "dismissed_at");
