ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'RESTRICTED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "restrictionReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "restrictionExpiresAt" TIMESTAMP(3);
CREATE TABLE "ModerationAppeal" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "caseId" TEXT NOT NULL, "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'SUBMITTED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3), "resolution" TEXT, CONSTRAINT "ModerationAppeal_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ModerationAppeal_userId_caseId_key" ON "ModerationAppeal"("userId", "caseId"); CREATE INDEX "ModerationAppeal_status_createdAt_idx" ON "ModerationAppeal"("status", "createdAt" DESC);
ALTER TABLE "ModerationAppeal" ADD CONSTRAINT "ModerationAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
