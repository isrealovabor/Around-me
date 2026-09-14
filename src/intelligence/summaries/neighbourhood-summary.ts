import type { ProcessedExternalEvent } from '../types'

export interface AreaSummary { title: string; facts: string[]; generatedAt: Date; sourceRecordIds: string[] }
/** Only summarizes provided records; it returns an empty fact list when there is no genuine activity. */
export function summarizeAreaToday(events: ProcessedExternalEvent[], now = new Date()): AreaSummary {
  const since = now.getTime() - 24 * 60 * 60 * 1000
  const eligible = events.filter(event => event.fetchedAt.getTime() >= since && event.processingStatus === 'processed' && event.extraction.summary)
  return { title: 'Your Area Today', facts: eligible.map(event => event.extraction.summary!).slice(0, 5), generatedAt: now, sourceRecordIds: eligible.map(event => event.contentHash) }
}
