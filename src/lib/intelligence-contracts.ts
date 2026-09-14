/**
 * Domain contracts for the future Around Me Intelligence service.
 * These are intentionally integration-neutral: no external source, AI model,
 * or push provider is connected in the MVP.
 */

export type AlertConfidence = 'low' | 'developing' | 'high'
export type CommunityAlertStatus = 'reported' | 'community_confirmed' | 'verified' | 'resolved'
export type AlertSourceKind = 'community_report' | 'news' | 'government' | 'emergency_service' | 'weather' | 'traffic' | 'electricity' | 'public_web'
export type DataSourceStatus = 'active' | 'paused' | 'error'

export interface DataSource {
  id: string
  name: string
  kind: AlertSourceKind
  status: DataSourceStatus
  baseUrl?: string
  pollingIntervalMinutes?: number
  enabledRegions: string[]
  lastSuccessfulSyncAt?: string
}

/** Raw, immutable record as received from a source before AI enrichment. */
export interface ExternalEvent {
  id: string
  dataSourceId: string
  externalId?: string
  receivedAt: string
  occurredAt?: string
  title: string
  body: string
  sourceUrl?: string
  rawPayload: Record<string, unknown>
  locationHint?: string
}

export interface AlertSource {
  id: string
  communityAlertId: string
  sourceKind: AlertSourceKind
  externalEventId?: string
  submittedByUserId?: string
  sourceUrl?: string
  observedAt: string
}

export interface AlertConfirmation {
  id: string
  communityAlertId: string
  userId: string
  createdAt: string
  note?: string
  /** Confirmation is a resident signal, not proof of fact. */
  type: 'seen' | 'affected' | 'resolved'
}

export interface CommunityAlert {
  id: string
  communityId: string
  category: string
  title: string
  description: string
  approximateLocation: string
  occurredAt?: string
  createdAt: string
  status: CommunityAlertStatus
  confidence: AlertConfidence
  confirmationCount: number
  affectedCommunityIds: string[]
  duplicateOfAlertId?: string
}

export interface IntelligenceProvider {
  normalize(event: ExternalEvent): Promise<ExternalEvent>
  extractLocation(event: ExternalEvent): Promise<{ label?: string; confidence: number }>
  categorize(event: ExternalEvent): Promise<{ category: string; confidence: number }>
  findDuplicates(event: ExternalEvent, candidates: CommunityAlert[]): Promise<string[]>
  summarize(events: ExternalEvent[]): Promise<string>
  assessConfidence(sources: AlertSource[], confirmations: AlertConfirmation[]): Promise<AlertConfidence>
}

export interface NotificationPayload {
  userId: string
  type: 'comment' | 'reply' | 'recommendation' | 'community_announcement' | 'safety_alert' | 'marketplace_activity'
  title: string
  body: string
  entityType: 'post' | 'alert' | 'listing' | 'service' | 'announcement'
  entityId: string
  channels: Array<'in_app' | 'push'>
}

/** Append-only record for safety-relevant moderation and alert changes. */
export interface AlertAuditEvent {
  id: string
  communityAlertId: string
  actorId?: string
  actorType: 'user' | 'moderator' | 'system'
  action: 'created' | 'confirmed' | 'flagged_misinformation' | 'status_changed' | 'notification_held' | 'notification_sent' | 'resolved'
  createdAt: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface ModerationHook {
  requiresHumanReview(alert: CommunityAlert): boolean
  canSendMassNotification(alert: CommunityAlert, sources: AlertSource[]): Promise<boolean>
  recordAuditEvent(event: AlertAuditEvent): Promise<void>
}
