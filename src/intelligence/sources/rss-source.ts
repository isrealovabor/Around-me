import { XMLParser } from 'fast-xml-parser'
import type { SourceItem, SourceMetadata } from '../types'
import { SourceDisabledError, type SourceAdapter } from './source-adapter'

type RssEntry = { guid?: string | { '#text'?: string }; link?: string | { '@_href'?: string }; title?: string; description?: string; 'content:encoded'?: string; pubDate?: string }

/** A generic, server-only RSS adapter. It is disabled until explicitly enabled in a backend deployment. */
export class RssSourceAdapter implements SourceAdapter {
  constructor(private readonly metadata: SourceMetadata, private readonly request: typeof fetch = fetch) {}
  getSourceMetadata() { return this.metadata }
  normalizeEvent(item: SourceItem): SourceItem { return { ...item, title: item.title.trim(), content: item.content.trim() } }
  async fetchUpdates(since?: Date): Promise<SourceItem[]> {
    if (!this.metadata.enabled) throw new SourceDisabledError(this.metadata.id)
    const response = await this.request(this.metadata.url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
    if (!response.ok) throw new Error(`RSS fetch failed for ${this.metadata.id}: ${response.status}`)
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(await response.text())
    const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? []
    const entries: RssEntry[] = Array.isArray(rawItems) ? rawItems : [rawItems]
    return entries.map((entry, index) => {
      const publishedAt = entry.pubDate ? new Date(entry.pubDate) : undefined
      const url = typeof entry.link === 'string' ? entry.link : entry.link?.['@_href'] ?? this.metadata.url
      const externalId = typeof entry.guid === 'string' ? entry.guid : entry.guid?.['#text'] ?? url ?? `${this.metadata.id}-${index}`
      return this.normalizeEvent({ externalId, title: entry.title ?? '(untitled)', content: entry['content:encoded'] ?? entry.description ?? '', url, publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined, rawPayload: entry as Record<string, unknown> })
    }).filter(item => !since || !item.publishedAt || item.publishedAt > since)
  }
}
