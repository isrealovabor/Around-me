import type { DeliveryChannel, NotificationType } from '@prisma/client'

export type NotificationInput = {
  userId: string; type: NotificationType; title: string; body: string; entityType: string; entityId: string
  data?: Record<string, unknown>; idempotencyKey: string; requestedChannels?: DeliveryChannel[]
}

export const notificationTypes = ['COMMENT', 'REPLY', 'MENTION', 'REACTION', 'RECOMMENDATION', 'COMMUNITY_ANNOUNCEMENT', 'SAFETY_ALERT', 'MARKETPLACE_ACTIVITY', 'EVENT_REMINDER', 'MODERATION_ACTION', 'VERIFICATION_STATUS', 'ACCOUNT_SECURITY'] as const

const forbiddenDataKey = /(password|secret|token|api[_-]?key|authorization|verification.?document|exact.?coordinate|latitude|longitude)/i
export function validateNotificationInput(input: NotificationInput) {
  if (!input.userId || !input.idempotencyKey || input.title.length > 160 || input.body.length > 1_000 || input.entityType.length > 80 || input.entityId.length > 160) throw new Error('INVALID_NOTIFICATION_INPUT')
  const inspect = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return true
    return !Object.entries(value as Record<string, unknown>).some(([key, nested]) => forbiddenDataKey.test(key) || !inspect(nested))
  }
  if (input.data && !inspect(input.data)) throw new Error('INVALID_NOTIFICATION_DATA')
}
