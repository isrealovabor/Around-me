import { Prisma, type DeliveryChannel, type NotificationPreference } from '@prisma/client'
import { prisma } from '../lib/prisma'
import type { BackgroundJobQueue } from '../jobs/job-queue'
import { allowedChannels } from './policy'
import { validateNotificationInput, type NotificationInput } from './types'

export class NotificationService {
  constructor(private readonly jobs?: BackgroundJobQueue) {}
  async create(input: NotificationInput) {
    validateNotificationInput(input)
    const preference = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } })
    const channels = allowedChannels(input.type, preference, input.requestedChannels)
    if (!channels.length) return undefined
    const idempotencyKey = `${input.userId}:${input.idempotencyKey}`
    const existing = await prisma.notification.findUnique({ where: { idempotencyKey } })
    const notification = existing ?? await prisma.notification.create({ data: {
      userId: input.userId, type: input.type, title: input.title, body: input.body, entityType: input.entityType, entityId: input.entityId,
      data: input.data as Prisma.InputJsonValue | undefined, idempotencyKey,
      deliveries: { create: channels.map(channel => ({ channel })) },
    } })
    if (!existing && this.jobs) void this.jobs.enqueue({ name: 'fan_out_notifications', idempotencyKey: `notification:${notification.id}:fanout`, payload: { notificationId: notification.id } })
    return notification
  }
  listForUser(userId: string) { return prisma.notification.findMany({ where: { userId }, include: { deliveries: true }, orderBy: { createdAt: 'desc' }, take: 50 }) }
  unreadCount(userId: string) { return prisma.notification.count({ where: { userId, readAt: null } }) }
  markRead(userId: string, notificationId: string) { return prisma.notification.updateMany({ where: { id: notificationId, userId, readAt: null }, data: { readAt: new Date() } }) }
  markAllRead(userId: string) { return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } }) }
  preferences(userId: string) { return prisma.notificationPreference.upsert({ where: { userId }, create: { userId }, update: {} }) }
  updatePreferences(userId: string, data: Partial<Pick<NotificationPreference, 'emailEnabled' | 'repliesCommentsEnabled' | 'mentionsEnabled' | 'localAlertsEnabled' | 'eventRemindersEnabled' | 'communityUpdatesEnabled' | 'marketingEnabled' | 'pushEnabled'>>) { return prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...data }, update: data }) }
}
