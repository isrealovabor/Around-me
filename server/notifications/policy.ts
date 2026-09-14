import type { DeliveryChannel, NotificationPreference, NotificationType } from '@prisma/client'

export function shouldDeliverInApp(type: NotificationType, preference?: NotificationPreference | null) {
  if (type === 'ACCOUNT_SECURITY') return true
  if (!preference) return true
  if (type === 'COMMENT' || type === 'REPLY') return preference.repliesCommentsEnabled
  if (type === 'MENTION') return preference.mentionsEnabled
  if (type === 'SAFETY_ALERT') return preference.localAlertsEnabled
  if (type === 'EVENT_REMINDER') return preference.eventRemindersEnabled
  if (type === 'COMMUNITY_ANNOUNCEMENT') return preference.communityUpdatesEnabled
  return true
}

export function allowedChannels(type: NotificationType, preference?: NotificationPreference | null, requested: DeliveryChannel[] = ['IN_APP']): DeliveryChannel[] {
  const channels = requested.filter(channel => {
    if (channel === 'PUSH') return Boolean(preference?.pushEnabled)
    if (channel === 'EMAIL') return type === 'ACCOUNT_SECURITY' || Boolean(preference?.emailEnabled)
    return shouldDeliverInApp(type, preference)
  })
  return channels.includes('IN_APP') || type !== 'ACCOUNT_SECURITY' ? channels : ['IN_APP', ...channels]
}

export function canMassNotify(disposition: 'normal' | 'potentially_urgent' | 'verified_alert') { return disposition === 'verified_alert' }
