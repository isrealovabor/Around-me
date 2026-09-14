import { describe, expect, it } from 'vitest'
import { areProbableDuplicates } from '../deduplication/deduplicator'
import { NigeriaLocationResolver } from '../geolocation/nigeria-location-resolver'
import { RssSourceAdapter } from '../sources/rss-source'
import { SourceDisabledError } from '../sources/source-adapter'
import { calculateConfidence } from '../verification/confidence'
import { targetCommunities } from '../alerts/community-targeting'
import { toPublicLocation } from '../privacy/location-privacy'
import { summarizeAreaToday } from '../summaries/neighbourhood-summary'
import type { ProcessedExternalEvent } from '../types'

const event = (title: string, location = 'Lekki Phase 1'): ProcessedExternalEvent => ({
  sourceId: 'source', sourceType: 'rss', originalTitle: title, originalContent: '', originalUrl: 'https://example.test/article', fetchedAt: new Date('2026-09-01T10:00:00Z'), rawPayload: {}, contentHash: title,
  extraction: { relevant: true, category: 'flood', keywords: [], confidence: .7, needsReview: false }, location: { country: 'NG', state: 'Lagos', city: 'Lagos', neighbourhood: location, confidence: .9 }, verificationStatus: 'unverified', confidence: 'medium', processingStatus: 'processed', lifecycle: 'active'
})

describe('Around Me Intelligence foundation', () => {
  it('keeps disabled sources from making network requests', async () => {
    const source = new RssSourceAdapter({ id: 'safe', name: 'Safe', type: 'rss', trustLevel: 'established_news', url: 'https://example.test/feed', enabled: false, fetchIntervalMinutes: 30 })
    await expect(source.fetchUpdates()).rejects.toBeInstanceOf(SourceDisabledError)
  })
  it('resolves only known Nigerian location phrases', async () => {
    const resolver = new NigeriaLocationResolver()
    await expect(resolver.resolve('Traffic on Admiralty Way, Lekki')).resolves.toMatchObject({ state: 'Lagos', neighbourhood: 'Lekki Phase 1' })
    await expect(resolver.resolve('Somewhere near Central Market')).resolves.toMatchObject({ confidence: 0 })
  })
  it('detects compatible duplicate reports but not different categories', () => {
    expect(areProbableDuplicates(event('Flooding reported in Lekki Phase 1'), event('Heavy flooding affecting Lekki Phase 1'))).toBe(true)
    expect(areProbableDuplicates(event('Flooding reported in Lekki Phase 1'), { ...event('Traffic reported in Lekki Phase 1'), extraction: { ...event('x').extraction, category: 'traffic' } })).toBe(false)
  })
  it('never returns verified without official confirmation', () => {
    expect(calculateConfidence({ trust: 'established_news', independentSources: 3, locationConsistency: 1, communityConfirmations: 8, officialConfirmation: false })).not.toBe('verified')
    expect(calculateConfidence({ trust: 'official_authority', independentSources: 1, locationConsistency: 1, communityConfirmations: 0, officialConfirmation: true })).toBe('verified')
  })
  it('targets only matching state and city communities', () => {
    const result = targetCommunities({ country: 'NG', state: 'Lagos', city: 'Lagos', confidence: .9 }, [{ communityId: 'lekki', state: 'Lagos', city: 'Lagos' }, { communityId: 'wuse', state: 'FCT', city: 'Abuja' }], 'medium')
    expect(result.map(item => item.communityId)).toEqual(['lekki'])
  })
  it('does not expose exact coordinates in public location data', () => {
    const publicLocation = toPublicLocation({ country: 'NG', city: 'Lagos', latitude: 6.4281, longitude: 3.4219, confidence: 1 })
    expect(publicLocation).not.toHaveProperty('latitude')
    expect(publicLocation).not.toHaveProperty('longitude')
    expect(publicLocation.confidence).toBe(.9)
  })
  it('does not invent a neighbourhood summary when no processed source records exist', () => {
    expect(summarizeAreaToday([], new Date('2026-09-01T12:00:00Z')).facts).toEqual([])
  })
})
