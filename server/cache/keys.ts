import { createHash } from 'node:crypto'

export const CACHE_TTLS_MS = {
  weather: 10 * 60_000,
  geocoding: 24 * 60 * 60_000,
  community: 30 * 60_000,
  trendingFeed: 2 * 60_000,
  aiDerived: 24 * 60 * 60_000,
} as const

function safeHash(value: string) { return createHash('sha256').update(value.trim().toLowerCase()).digest('hex').slice(0, 32) }
function rounded(latitude: number, longitude: number) { return `${latitude.toFixed(2)}:${longitude.toFixed(2)}` }

/** Never put raw emails, phone numbers, access tokens, or precise home locations in keys. */
export const cacheKeys = {
  weather: (latitude: number, longitude: number) => `weather:v1:${rounded(latitude, longitude)}`,
  geocode: (query: string) => `geocode:v1:${safeHash(query)}`,
  reverseGeocode: (latitude: number, longitude: number) => `reverse-geocode:v1:${rounded(latitude, longitude)}`,
  community: (communityId: string) => `community:v1:${communityId}`,
  feed: (scope: string, locationId: string) => `feed:v1:${scope}:${locationId}`,
  rateLimit: (scope: string, identifier: string) => `rate-limit:v1:${scope}:${safeHash(identifier)}`,
}
