export type IntelligenceJobName = 'fetch_sources' | 'process_events' | 'deduplicate_events' | 'recalculate_confidence' | 'expire_stale_events'
export interface IntelligenceJobQueue { enqueue(name: IntelligenceJobName, payload?: Record<string, unknown>): Promise<void>; schedule(name: IntelligenceJobName, everyMinutes: number): Promise<void> }
/** Development-only queue adapter. Production must provide a durable queue implementation. */
export class InMemoryIntelligenceQueue implements IntelligenceJobQueue { readonly jobs: Array<{ name: IntelligenceJobName; payload?: Record<string, unknown> }> = []; async enqueue(name: IntelligenceJobName, payload?: Record<string, unknown>) { this.jobs.push({ name, payload }) } async schedule() {} }
