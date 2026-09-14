export type AlertDistancePreference = 'one_km' | 'two_km' | 'five_km' | 'ten_km' | 'community_only' | 'city'
export type NotificationLevel = 'all' | 'important_only' | 'off'
export interface IntelligenceNotificationPreference { safety: NotificationLevel; traffic: NotificationLevel; weather: boolean; flood: boolean; power: boolean; community: boolean; marketplace: boolean; services: boolean; distance: AlertDistancePreference; quietHours?: { start: string; end: string }; allowCriticalSafetyOverride: boolean; morningBriefEnabled: boolean; eveningBriefEnabled: boolean }
export interface PushMessage { title: string; body: string; userId: string; deduplicationKey: string; priority: 'normal' | 'critical'; data: Record<string, string> }
export interface PushProvider { channel: 'web_push' | 'android' | 'ios'; send(message: PushMessage): Promise<{ delivered: boolean; providerMessageId?: string }> }
export interface AsyncNotificationQueue { enqueue(message: PushMessage): Promise<void> }
