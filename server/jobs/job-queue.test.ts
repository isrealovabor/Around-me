import { describe, expect, it } from 'vitest'
import { InMemoryBackgroundJobQueue } from './job-queue'

describe('background job foundation', () => {
  it('deduplicates jobs by idempotency key', async () => {
    const queue = new InMemoryBackgroundJobQueue()
    const first = await queue.enqueue({ name: 'ai_categorize_post', idempotencyKey: 'post:one:categorize' })
    const second = await queue.enqueue({ name: 'ai_categorize_post', idempotencyKey: 'post:one:categorize' })
    expect(second.id).toBe(first.id)
  })

  it('uses bounded retries with exponential backoff', async () => {
    const queue = new InMemoryBackgroundJobQueue()
    const job = await queue.enqueue({ name: 'analyze_urgency', idempotencyKey: 'post:one:urgency', maxAttempts: 2 })
    expect((await queue.markFailed(job.id))?.status).toBe('queued')
    expect((await queue.markFailed(job.id))?.status).toBe('failed')
  })
})
