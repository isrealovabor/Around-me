import { describe, expect, it } from 'vitest'
import { InMemoryBackgroundJobQueue } from '../jobs/job-queue'
import { allowedChannels, canMassNotify, shouldDeliverInApp } from './policy'
import { validateNotificationInput } from './types'

describe('notification foundation', () => {
  it('filters opted-out notification categories but preserves account safety', () => {
    const preference = { repliesCommentsEnabled: false, mentionsEnabled: false, localAlertsEnabled: false, eventRemindersEnabled: false, communityUpdatesEnabled: false, emailEnabled: false, pushEnabled: false } as never
    expect(shouldDeliverInApp('COMMENT', preference)).toBe(false)
    expect(shouldDeliverInApp('ACCOUNT_SECURITY', preference)).toBe(true)
    expect(allowedChannels('ACCOUNT_SECURITY', preference, ['EMAIL'])).toContain('EMAIL')
  })

  it('rejects sensitive notification payload fields and only permits verified mass alerts', () => {
    expect(() => validateNotificationInput({ userId: 'user', type: 'COMMENT', title: 'Reply', body: 'A reply', entityType: 'post', entityId: 'post', idempotencyKey: 'one', data: { accessToken: 'nope' } })).toThrow('INVALID_NOTIFICATION_DATA')
    expect(canMassNotify('potentially_urgent')).toBe(false)
    expect(canMassNotify('verified_alert')).toBe(true)
  })

  it('queues background fan-out idempotently with bounded retries', async () => {
    const jobs = new InMemoryBackgroundJobQueue()
    const first = await jobs.enqueue({ name: 'fan_out_notifications', idempotencyKey: 'notification:one:fanout', maxAttempts: 2 })
    expect((await jobs.enqueue({ name: 'fan_out_notifications', idempotencyKey: 'notification:one:fanout' })).id).toBe(first.id)
    await jobs.markFailed(first.id)
    expect((await jobs.markFailed(first.id))?.status).toBe('failed')
  })
})
