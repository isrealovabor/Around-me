export type SourceType = 'rss' | 'news_api' | 'government_api' | 'weather_api' | 'traffic_api' | 'electricity' | 'emergency' | 'manual_feed'
export type SourceTrustLevel = 'official_authority' | 'established_news' | 'verified_local_organisation' | 'community_report' | 'unknown_public'
export type IntelligenceCategory = 'security' | 'accident' | 'fire' | 'flood' | 'weather' | 'traffic' | 'road_closure' | 'power' | 'water' | 'health' | 'missing_person' | 'public_safety' | 'infrastructure' | 'community_announcement' | 'other'
export type IntelligenceConfidence = 'low' | 'medium' | 'high' | 'verified'
export type VerificationStatus = 'unverified' | 'corroborated' | 'officially_verified' | 'rejected'
export type ProcessingStatus = 'pending' | 'processed' | 'needs_review' | 'failed' | 'duplicate'
export type EventLifecycle = 'active' | 'monitoring' | 'resolved' | 'expired'

export interface SourceMetadata {
  id: string
  name: string
  type: SourceType
  trustLevel: SourceTrustLevel
  url: string
  enabled: boolean
  fetchIntervalMinutes: number
  termsUrl?: string
}

export interface SourceItem {
  externalId: string
  title: string
  content: string
  url: string
  publishedAt?: Date
  rawPayload: Record<string, unknown>
}

export interface NigerianLocation {
  country: 'NG'
  state?: string
  lga?: string
  city?: string
  neighbourhood?: string
  latitude?: number
  longitude?: number
  confidence: number
}

export interface ExternalEventInput {
  sourceId: string
  sourceType: SourceType
  originalTitle: string
  originalContent: string
  originalUrl: string
  publishedAt?: Date
  fetchedAt: Date
  rawPayload: Record<string, unknown>
  contentHash: string
}

export interface ExtractedEvent {
  relevant: boolean
  summary?: string
  category?: IntelligenceCategory
  locationText?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  occurredAt?: Date
  ongoing?: boolean
  sourcePerspective?: 'firsthand' | 'quoted' | 'unclear'
  keywords: string[]
  confidence: number
  needsReview: boolean
}

export interface ProcessedExternalEvent extends ExternalEventInput {
  extraction: ExtractedEvent
  location: NigerianLocation
  verificationStatus: VerificationStatus
  confidence: IntelligenceConfidence
  processingStatus: ProcessingStatus
  duplicateGroupId?: string
  lifecycle: EventLifecycle
}

export interface CommunityTarget {
  communityId: string
  state?: string
  city?: string
  latitude?: number
  longitude?: number
}
