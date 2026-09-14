import { prisma } from '../lib/prisma'
import type { TransactionalEmailService } from '../email/service'

/** Called by a worker after insertion; it never changes the originating post or alert. */
export class NotificationDeliveryWorker {
  constructor(private readonly email?: TransactionalEmailService) {}
  async deliverEmail(notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId }, include: { user: true, deliveries: { where: { channel: 'EMAIL' } } } })
    const delivery = notification?.deliveries[0]
    if (!notification || !delivery || delivery.status === 'DELIVERED') return false
    const sent = this.email ? await this.email.sendNotification(notification.user, notification.title, notification.body) : false
    await prisma.notificationDelivery.update({ where: { id: delivery.id }, data: sent ? { status: 'DELIVERED', deliveredAt: new Date(), error: null } : { status: 'FAILED', error: 'EMAIL_UNAVAILABLE' } })
    return sent
  }
}
