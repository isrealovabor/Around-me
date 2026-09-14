import type { SourceItem, SourceMetadata } from '../types'

export interface SourceAdapter {
  getSourceMetadata(): SourceMetadata
  fetchUpdates(since?: Date): Promise<SourceItem[]>
  normalizeEvent(item: SourceItem): SourceItem
}

export class SourceDisabledError extends Error {
  constructor(sourceId: string) { super(`Source ${sourceId} is disabled.`) }
}
