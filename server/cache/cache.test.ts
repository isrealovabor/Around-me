import { describe, expect, it } from 'vitest'
import { InMemoryCacheService, ResilientRedisCacheService, type RedisTransport } from './service'
import { RedisRateLimitStore, enforceRateLimit } from '../middleware/rate-limit'

describe('cache foundation', () => {
  it('stores structured values, returns misses, and expires values', async () => {
    let now = 0; const cache = new InMemoryCacheService(() => now)
    await cache.set('weather:v1:6.46:3.18', { temperature: 29 }, 100)
    await expect(cache.get('weather:v1:6.46:3.18')).resolves.toEqual({ temperature: 29 })
    await expect(cache.get('weather:v1:missing')).resolves.toBeUndefined()
    now = 101
    await expect(cache.get('weather:v1:6.46:3.18')).resolves.toBeUndefined()
  })

  it('falls back safely when Redis is unavailable', async () => {
    const unavailable: RedisTransport = { command: async () => { throw new Error('offline') }, ping: async () => false }
    const cache = new ResilientRedisCacheService(unavailable)
    await cache.set('community:v1:one', { name: 'Community' }, 1_000)
    await expect(cache.get('community:v1:one')).resolves.toEqual({ name: 'Community' })
  })

  it('treats corrupt Redis JSON as a cache miss', async () => {
    const corrupt: RedisTransport = { command: async () => 'not-json', ping: async () => true }
    await expect(new ResilientRedisCacheService(corrupt).get('feed:v1:home:one')).resolves.toBeUndefined()
  })

  it('provides a hashed-key rate-limit foundation', async () => {
    const store = new RedisRateLimitStore(new InMemoryCacheService())
    await enforceRateLimit(store, 'login:resident@example.test', 2, 60)
    await enforceRateLimit(store, 'login:resident@example.test', 2, 60)
    await expect(enforceRateLimit(store, 'login:resident@example.test', 2, 60)).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })
})
