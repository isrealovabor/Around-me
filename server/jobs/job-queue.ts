import { randomUUID } from 'node:crypto'

export type JobName = 'process_post' | 'ai_categorize_post' | 'analyze_urgency' | 'moderate_content' | 'fan_out_notifications' | 'refresh_weather' | 'enrich_geocode' | 'recalculate_trending' | 'generate_digest' | 'cleanup_content'
export type UrgencyDisposition = 'normal' | 'potentially_urgent' | 'verified_alert'
export type BackgroundJob = { id: string; name: JobName; payload: Record<string, unknown>; idempotencyKey: string; attempts: number; maxAttempts: number; status: 'queued' | 'processing' | 'failed' | 'completed'; nextAttemptAt?: Date }

export interface BackgroundJobQueue {
  enqueue(input: { name: JobName; payload?: Record<string, unknown>; idempotencyKey: string; maxAttempts?: number }): Promise<BackgroundJob>
  markFailed(jobId: string): Promise<BackgroundJob | undefined>
}

/** Foundation only: callers may enqueue after a successful DB transaction. It never changes a verified alert state. */
export class InMemoryBackgroundJobQueue implements BackgroundJobQueue {
  private readonly jobs = new Map<string, BackgroundJob>()
  private readonly byIdempotency = new Map<string, string>()
  async enqueue(input: { name: JobName; payload?: Record<string, unknown>; idempotencyKey: string; maxAttempts?: number }) {
    const existingId = this.byIdempotency.get(input.idempotencyKey)
    if (existingId) return this.jobs.get(existingId)!
    const job: BackgroundJob = { id: randomUUID(), name: input.name, payload: input.payload ?? {}, idempotencyKey: input.idempotencyKey, attempts: 0, maxAttempts: Math.max(1, Math.min(input.maxAttempts ?? 3, 5)), status: 'queued' }
    this.jobs.set(job.id, job); this.byIdempotency.set(job.idempotencyKey, job.id)
    return job
  }
  async markFailed(jobId: string) {
    const job = this.jobs.get(jobId); if (!job) return undefined
    job.attempts += 1
    if (job.attempts >= job.maxAttempts) { job.status = 'failed'; return job }
    job.status = 'queued'; job.nextAttemptAt = new Date(Date.now() + 1_000 * 2 ** job.attempts)
    return job
  }
}
