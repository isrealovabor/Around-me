ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REACTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MODERATION_ACTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'VERIFICATION_STATUS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_SECURITY';

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Notification_userId_idempotencyKey_idx" ON "Notification"("userId", "idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_notificationId_channel_key" ON "NotificationDelivery"("notificationId", "channel");

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "repliesCommentsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "mentionsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "localAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "eventRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "communityUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "marketingEnabled" BOOLEAN NOT NULL DEFAULT false;
