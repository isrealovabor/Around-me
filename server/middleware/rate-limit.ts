import { ApiError } from '../lib/errors'
import { cacheKeys } from '../cache/keys'
import type { CacheService } from '../cache/service'

export const RATE_LIMITS = {
  registration: { limit: 3, windowSeconds: 60 * 60 },
  resendVerification: { limit: 3, windowSeconds: 60 * 60 },
  passwordReset: { limit: 3, windowSeconds: 60 * 60 },
  resetAttempt: { limit: 5, windowSeconds: 60 * 60 },
  login: { limit: 10, windowSeconds: 15 * 60 },
} as const

export interface RateLimitStore { increment(key: string, windowSeconds: number): Promise<number> }
/** Development-only store. Replace with Redis/managed edge limiting before multi-instance deployment. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, { count: number; expiresAt: number }>()
  async increment(key: string, windowSeconds: number) {
    const now = Date.now(); const entry = this.entries.get(key)
    if (!entry || entry.expiresAt <= now) { this.entries.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 }); return 1 }
    entry.count += 1; return entry.count
  }
}
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly cache: CacheService) {}
  async increment(key: string, windowSeconds: number) {
    const scopedKey = cacheKeys.rateLimit('request', key)
    const count = await this.cache.increment(scopedKey)
    if (count === 1) await this.cache.expire(scopedKey, windowSeconds * 1000)
    return count
  }
}
export async function enforceRateLimit(store: RateLimitStore, key: string, limit: number, windowSeconds: number) {
  if (await store.increment(key, windowSeconds) > limit) throw new ApiError(429, 'Too many requests. Please try again later.', 'RATE_LIMITED')
}
