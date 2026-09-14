import type { NormalizedLocation } from '../../src/maps/types'
import { normalizeMapboxFeature } from '../../src/maps/normalize'

export class MapboxGeocodingClient {
  constructor(private readonly token: string) {}
  async forward(query: string, options: { proximity?: readonly [number, number]; limit?: number } = {}) {
    if (!query.trim() || query.length > 200) throw new Error('Invalid geocoding query')
    const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
    url.searchParams.set('q', query); url.searchParams.set('country', 'ng'); url.searchParams.set('limit', String(Math.min(options.limit ?? 5, 10))); url.searchParams.set('access_token', this.token)
    if (options.proximity) url.searchParams.set('proximity', options.proximity.join(','))
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (!response.ok) throw new Error(`MAPBOX_${response.status}`)
    const body = await response.json() as { features?: unknown[] }
    return (body.features ?? []).map(item => normalizeMapboxFeature(item as Parameters<typeof normalizeMapboxFeature>[0])).filter(location => location.countryCode?.toLowerCase() === 'ng')
  }
  async reverse(longitude: number, latitude: number): Promise<NormalizedLocation[]> {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error('Invalid geocoding coordinates')
    const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse')
    url.searchParams.set('longitude', String(longitude)); url.searchParams.set('latitude', String(latitude)); url.searchParams.set('country', 'ng'); url.searchParams.set('access_token', this.token)
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (!response.ok) throw new Error(`MAPBOX_${response.status}`)
    const body = await response.json() as { features?: unknown[] }
    return (body.features ?? []).map(item => normalizeMapboxFeature(item as Parameters<typeof normalizeMapboxFeature>[0]))
  }
}
