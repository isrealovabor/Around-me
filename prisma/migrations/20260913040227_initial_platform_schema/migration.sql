-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMMUNITY_MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VerificationSubjectType" AS ENUM ('USER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_SUSPENDED', 'USER_BANNED', 'ALERT_VERIFIED', 'ALERT_RESOLVED', 'BUSINESS_VERIFIED', 'MODERATION_DECISION', 'SETTINGS_CHANGED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LocationVerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "CoordinatesConfidence" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TrafficConfirmationType" AS ENUM ('STILL_HAPPENING', 'CLEARED', 'NOT_SEEING_THIS');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('GENERAL', 'QUESTION', 'SAFETY', 'TRAFFIC', 'EMERGENCY', 'LOST_FOUND', 'MARKETPLACE', 'SERVICES', 'EVENTS', 'JOBS', 'LOCAL_ISSUES');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('REPORTED', 'COMMUNITY_CONFIRMED', 'VERIFIED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AlertConfidence" AS ENUM ('LOW', 'DEVELOPING', 'HIGH');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'COMMENT', 'ALERT', 'LISTING', 'BUSINESS', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'REMOVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT', 'REPLY', 'RECOMMENDATION', 'COMMUNITY_ANNOUNCEMENT', 'SAFETY_ALERT', 'MARKETPLACE_ACTIVITY');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "DataSourceKind" AS ENUM ('COMMUNITY_REPORT', 'NEWS', 'GOVERNMENT', 'EMERGENCY_SERVICE', 'WEATHER', 'TRAFFIC', 'ELECTRICITY', 'PUBLIC_WEB');

-- CreateEnum
CREATE TYPE "DataSourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "SourceTrustLevel" AS ENUM ('OFFICIAL_AUTHORITY', 'ESTABLISHED_NEWS', 'VERIFIED_LOCAL_ORGANISATION', 'COMMUNITY_REPORT', 'UNKNOWN_PUBLIC');

-- CreateEnum
CREATE TYPE "ExternalEventCategory" AS ENUM ('SECURITY', 'ACCIDENT', 'FIRE', 'FLOOD', 'WEATHER', 'TRAFFIC', 'ROAD_CLOSURE', 'POWER', 'WATER', 'HEALTH', 'MISSING_PERSON', 'PUBLIC_SAFETY', 'INFRASTRUCTURE', 'COMMUNITY_ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExternalEventSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ExternalEventProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'NEEDS_REVIEW', 'FAILED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ExternalEventLifecycle" AS ENUM ('ACTIVE', 'MONITORING', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExternalVerificationStatus" AS ENUM ('UNVERIFIED', 'CORROBORATED', 'OFFICIALLY_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConfirmationType" AS ENUM ('SEEN', 'AFFECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'MODERATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AlertAuditAction" AS ENUM ('CREATED', 'CONFIRMED', 'FLAGGED_MISINFORMATION', 'STATUS_CHANGED', 'NOTIFICATION_HELD', 'NOTIFICATION_SENT', 'RESOLVED');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "parentId" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "source" TEXT,
    "sourceReference" TEXT,
    "verificationStatus" "LocationVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "coordinatesConfidence" "CoordinatesConfidence" NOT NULL DEFAULT 'NONE',
    "boundaryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'PASSWORD',
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "phoneNumber" TEXT,
    "locationId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT,
    "photoObjectKey" TEXT,
    "phoneNumber" TEXT,
    "bio" TEXT,
    "primaryCommunityId" TEXT,
    "locationVisibility" TEXT NOT NULL DEFAULT 'COMMUNITY_ONLY',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAlert" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "creatorId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approximateLocation" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "status" "AlertStatus" NOT NULL DEFAULT 'REPORTED',
    "confidence" "AlertConfidence" NOT NULL DEFAULT 'LOW',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "broadNotificationSentAt" TIMESTAMP(3),
    "duplicateOfAlertId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertUpdate" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "authorId" TEXT,
    "status" "AlertStatus",
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfirmation" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConfirmationType" NOT NULL DEFAULT 'SEEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "DataSourceKind" NOT NULL,
    "status" "DataSourceStatus" NOT NULL DEFAULT 'PAUSED',
    "trustLevel" "SourceTrustLevel" NOT NULL DEFAULT 'UNKNOWN_PUBLIC',
    "baseUrl" TEXT,
    "pollingIntervalMinutes" INTEGER,
    "enabledRegions" TEXT[],
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalEvent" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceType" "DataSourceKind" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3),
    "originalTitle" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "locationHint" TEXT,
    "detectedCategory" "ExternalEventCategory",
    "detectedLocation" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "state" TEXT,
    "city" TEXT,
    "neighbourhood" TEXT,
    "severity" "ExternalEventSeverity",
    "confidence" "AlertConfidence" NOT NULL DEFAULT 'LOW',
    "verificationStatus" "ExternalVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "duplicateGroupId" TEXT,
    "eventClusterId" TEXT,
    "processingStatus" "ExternalEventProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "lifecycle" "ExternalEventLifecycle" NOT NULL DEFAULT 'MONITORING',
    "processingError" TEXT,

    CONSTRAINT "ExternalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCluster" (
    "id" TEXT NOT NULL,
    "canonicalTitle" TEXT NOT NULL,
    "canonicalCategory" "ExternalEventCategory",
    "status" "ExternalEventLifecycle" NOT NULL DEFAULT 'MONITORING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceReviewCase" (
    "id" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "IntelligenceReviewCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSource" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "externalEventId" TEXT,
    "sourceKind" "DataSourceKind" NOT NULL,
    "sourceUrl" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertAuditEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "action" "AlertAuditAction" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "serviceArea" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "imageUrls" TEXT[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessImage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRecommendation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReview" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "categoryId" TEXT,
    "imageUrls" TEXT[],
    "approximateLocation" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "moderatorId" TEXT,
    "targetType" "ReportTargetType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "alertId" TEXT,
    "businessId" TEXT,
    "listingId" TEXT,
    "targetUserId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recommendationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "safetyAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketplaceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAnnouncement" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectType" "VerificationSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceKey" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationCase" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ModerationPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedToId" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyPlace" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureReport" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "reporterId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfrastructureReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficReport" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "locationId" TEXT,
    "sourceId" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TrafficReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficReportConfirmation" (
    "id" TEXT NOT NULL,
    "trafficReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TrafficConfirmationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficReportConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerReport" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "locationId" TEXT,
    "sourceId" TEXT,
    "kind" TEXT NOT NULL,
    "distributionCompany" TEXT,
    "feeder" TEXT,
    "transformerLabel" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "PowerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherEvent" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "sourceId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "WeatherEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloodReport" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FloodReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE INDEX "Location_parentId_type_idx" ON "Location"("parentId", "type");

-- CreateIndex
CREATE INDEX "Location_countryCode_type_name_idx" ON "Location"("countryCode", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_locationId_isActive_idx" ON "Community"("locationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_locationId_suspendedAt_idx" ON "User"("locationId", "suspendedAt");

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "User"("verificationStatus");

-- CreateIndex
CREATE INDEX "CommunityMembership_communityId_role_status_idx" ON "CommunityMembership"("communityId", "role", "status");

-- CreateIndex
CREATE INDEX "CommunityMembership_userId_status_idx" ON "CommunityMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMembership_userId_communityId_key" ON "CommunityMembership"("userId", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- CreateIndex
CREATE INDEX "Profile_primaryCommunityId_idx" ON "Profile"("primaryCommunityId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_type_expiresAt_idx" ON "AuthToken"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "Post_communityId_createdAt_idx" ON "Post"("communityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_communityId_category_createdAt_idx" ON "Post"("communityId", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PostImage_objectKey_key" ON "PostImage"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "PostImage_postId_position_key" ON "PostImage"("postId", "position");

-- CreateIndex
CREATE INDEX "SavedPost_userId_createdAt_idx" ON "SavedPost"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_userId_postId_key" ON "SavedPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_createdAt_idx" ON "Comment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_postId_createdAt_idx" ON "Reaction"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_userId_type_key" ON "Reaction"("postId", "userId", "type");

-- CreateIndex
CREATE INDEX "CommunityAlert_communityId_status_createdAt_idx" ON "CommunityAlert"("communityId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityAlert_communityId_category_createdAt_idx" ON "CommunityAlert"("communityId", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityAlert_requiresHumanReview_status_idx" ON "CommunityAlert"("requiresHumanReview", "status");

-- CreateIndex
CREATE INDEX "AlertUpdate_alertId_createdAt_idx" ON "AlertUpdate"("alertId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AlertConfirmation_alertId_createdAt_idx" ON "AlertConfirmation"("alertId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfirmation_alertId_userId_type_key" ON "AlertConfirmation"("alertId", "userId", "type");

-- CreateIndex
CREATE INDEX "DataSource_kind_status_idx" ON "DataSource"("kind", "status");

-- CreateIndex
CREATE INDEX "ExternalEvent_dataSourceId_receivedAt_idx" ON "ExternalEvent"("dataSourceId", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "ExternalEvent_occurredAt_idx" ON "ExternalEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ExternalEvent_processingStatus_receivedAt_idx" ON "ExternalEvent"("processingStatus", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "ExternalEvent_duplicateGroupId_idx" ON "ExternalEvent"("duplicateGroupId");

-- CreateIndex
CREATE INDEX "ExternalEvent_state_city_detectedCategory_idx" ON "ExternalEvent"("state", "city", "detectedCategory");

-- CreateIndex
CREATE INDEX "ExternalEvent_eventClusterId_processingStatus_idx" ON "ExternalEvent"("eventClusterId", "processingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalEvent_dataSourceId_externalId_key" ON "ExternalEvent"("dataSourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalEvent_dataSourceId_contentHash_key" ON "ExternalEvent"("dataSourceId", "contentHash");

-- CreateIndex
CREATE INDEX "EventCluster_canonicalCategory_status_updatedAt_idx" ON "EventCluster"("canonicalCategory", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "IntelligenceReviewCase_status_priority_createdAt_idx" ON "IntelligenceReviewCase"("status", "priority", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AlertSource_alertId_observedAt_idx" ON "AlertSource"("alertId", "observedAt");

-- CreateIndex
CREATE INDEX "AlertSource_externalEventId_idx" ON "AlertSource"("externalEventId");

-- CreateIndex
CREATE INDEX "AlertAuditEvent_alertId_createdAt_idx" ON "AlertAuditEvent"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "AlertAuditEvent_action_createdAt_idx" ON "AlertAuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Business_communityId_categoryId_isActive_idx" ON "Business"("communityId", "categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Business_verificationStatus_idx" ON "Business"("verificationStatus");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_slug_key" ON "BusinessCategory"("slug");

-- CreateIndex
CREATE INDEX "BusinessCategory_name_idx" ON "BusinessCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessImage_objectKey_key" ON "BusinessImage"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessImage_businessId_position_key" ON "BusinessImage"("businessId", "position");

-- CreateIndex
CREATE INDEX "BusinessRecommendation_businessId_createdAt_idx" ON "BusinessRecommendation"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRecommendation_businessId_authorId_key" ON "BusinessRecommendation"("businessId", "authorId");

-- CreateIndex
CREATE INDEX "BusinessReview_businessId_createdAt_idx" ON "BusinessReview"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessReview_businessId_authorId_key" ON "BusinessReview"("businessId", "authorId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_communityId_status_createdAt_idx" ON "MarketplaceListing"("communityId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_communityId_categoryId_status_createdAt_idx" ON "MarketplaceListing"("communityId", "categoryId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_status_idx" ON "MarketplaceListing"("sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceCategory_slug_key" ON "MarketplaceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceImage_objectKey_key" ON "MarketplaceImage"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceImage_listingId_position_key" ON "MarketplaceImage"("listingId", "position");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentReport_targetType_createdAt_idx" ON "ContentReport"("targetType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_status_idx" ON "NotificationDelivery"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "CommunityAnnouncement_communityId_publishedAt_idx" ON "CommunityAnnouncement"("communityId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "VerificationRequest_subjectType_subjectId_status_idx" ON "VerificationRequest"("subjectType", "subjectId", "status");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_createdAt_idx" ON "VerificationRequest"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserReport_targetType_targetId_createdAt_idx" ON "UserReport"("targetType", "targetId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserReport_reporterId_createdAt_idx" ON "UserReport"("reporterId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ModerationCase_reportId_key" ON "ModerationCase"("reportId");

-- CreateIndex
CREATE INDEX "ModerationCase_status_priority_createdAt_idx" ON "ModerationCase"("status", "priority", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ModerationCase_assignedToId_status_idx" ON "ModerationCase"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "ModerationAction_caseId_createdAt_idx" ON "ModerationAction"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmergencyPlace_type_verifiedAt_idx" ON "EmergencyPlace"("type", "verifiedAt");

-- CreateIndex
CREATE INDEX "InfrastructureReport_communityId_status_createdAt_idx" ON "InfrastructureReport"("communityId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficReport_communityId_status_occurredAt_idx" ON "TrafficReport"("communityId", "status", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficReportConfirmation_trafficReportId_type_createdAt_idx" ON "TrafficReportConfirmation"("trafficReportId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficReportConfirmation_trafficReportId_userId_key" ON "TrafficReportConfirmation"("trafficReportId", "userId");

-- CreateIndex
CREATE INDEX "PowerReport_communityId_status_occurredAt_idx" ON "PowerReport"("communityId", "status", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "WeatherEvent_locationId_observedAt_idx" ON "WeatherEvent"("locationId", "observedAt" DESC);

-- CreateIndex
CREATE INDEX "FloodReport_communityId_status_occurredAt_idx" ON "FloodReport"("communityId", "status", "occurredAt" DESC);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_primaryCommunityId_fkey" FOREIGN KEY ("primaryCommunityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAlert" ADD CONSTRAINT "CommunityAlert_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAlert" ADD CONSTRAINT "CommunityAlert_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAlert" ADD CONSTRAINT "CommunityAlert_duplicateOfAlertId_fkey" FOREIGN KEY ("duplicateOfAlertId") REFERENCES "CommunityAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertUpdate" ADD CONSTRAINT "AlertUpdate_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CommunityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertConfirmation" ADD CONSTRAINT "AlertConfirmation_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CommunityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertConfirmation" ADD CONSTRAINT "AlertConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEvent" ADD CONSTRAINT "ExternalEvent_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalEvent" ADD CONSTRAINT "ExternalEvent_eventClusterId_fkey" FOREIGN KEY ("eventClusterId") REFERENCES "EventCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceReviewCase" ADD CONSTRAINT "IntelligenceReviewCase_externalEventId_fkey" FOREIGN KEY ("externalEventId") REFERENCES "ExternalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceReviewCase" ADD CONSTRAINT "IntelligenceReviewCase_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSource" ADD CONSTRAINT "AlertSource_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CommunityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSource" ADD CONSTRAINT "AlertSource_externalEventId_fkey" FOREIGN KEY ("externalEventId") REFERENCES "ExternalEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditEvent" ADD CONSTRAINT "AlertAuditEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CommunityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditEvent" ADD CONSTRAINT "AlertAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImage" ADD CONSTRAINT "BusinessImage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRecommendation" ADD CONSTRAINT "BusinessRecommendation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRecommendation" ADD CONSTRAINT "BusinessRecommendation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceImage" ADD CONSTRAINT "MarketplaceImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "CommunityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAnnouncement" ADD CONSTRAINT "CommunityAnnouncement_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "UserReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficReportConfirmation" ADD CONSTRAINT "TrafficReportConfirmation_trafficReportId_fkey" FOREIGN KEY ("trafficReportId") REFERENCES "TrafficReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficReportConfirmation" ADD CONSTRAINT "TrafficReportConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
