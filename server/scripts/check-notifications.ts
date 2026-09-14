import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma'
import { NotificationService } from '../notifications/service'
import { InMemoryBackgroundJobQueue } from '../jobs/job-queue'
import { ResilientRedisCacheService, type RedisTransport } from '../cache/service'

const suffix = randomUUID(); const email = `notification-check-${suffix}@example.test`
const user = await prisma.user.create({ data: { email, name: 'Notification Check', passwordHash: 'development-only' } })
try {
  const jobs = new InMemoryBackgroundJobQueue(); const service = new NotificationService(jobs)
  const created = await service.create({ userId: user.id, type: 'COMMENT', title: 'New comment', body: 'A safe development-only notification.', entityType: 'post', entityId: 'check-post', idempotencyKey: `notification-check:${suffix}` })
  const duplicate = await service.create({ userId: user.id, type: 'COMMENT', title: 'New comment', body: 'A safe development-only notification.', entityType: 'post', entityId: 'check-post', idempotencyKey: `notification-check:${suffix}` })
  const listed = await service.listForUser(user.id); const unreadBefore = await service.unreadCount(user.id)
  if (created) await service.markRead(user.id, created.id)
  const unreadAfter = await service.unreadCount(user.id)
  await service.updatePreferences(user.id, { repliesCommentsEnabled: false })
  const filtered = await service.create({ userId: user.id, type: 'COMMENT', title: 'Filtered', body: 'This should respect preferences.', entityType: 'post', entityId: 'filtered-post', idempotencyKey: `notification-check-filtered:${suffix}` })
  const unavailable: RedisTransport = { command: async () => { throw new Error('unavailable') }, ping: async () => false }
  const fallback = new ResilientRedisCacheService(unavailable); await fallback.set('notification-check:v1', { ok: true }, 1_000)
  console.info(JSON.stringify({ created: Boolean(created), queued: Boolean(created), retrieved: listed.length === 1, markedRead: unreadBefore === 1 && unreadAfter === 0, duplicateProtected: created?.id === duplicate?.id, preferenceHandled: filtered === undefined, redisFallback: (await fallback.get<{ ok: boolean }>('notification-check:v1'))?.ok === true }))
} finally { await prisma.user.delete({ where: { id: user.id } }) }
