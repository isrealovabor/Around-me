import type { SourceAdapter } from './source-adapter'
import { RssSourceAdapter } from './rss-source'

/** Public feed configuration is intentionally disabled by default. Verify terms and obtain operational approval before enabling. */
export const sourceRegistry: SourceAdapter[] = [
  new RssSourceAdapter({ id: 'guardian-nigeria-rss', name: 'The Guardian Nigeria RSS', type: 'rss', trustLevel: 'established_news', url: 'https://guardian.ng/feed/', enabled: false, fetchIntervalMinutes: 20 })
]

export function findSource(id: string) { return sourceRegistry.find(source => source.getSourceMetadata().id === id) }
