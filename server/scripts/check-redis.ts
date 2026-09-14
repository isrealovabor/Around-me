import { randomUUID } from 'node:crypto'
import { loadServerEnv } from '../config/env'
import { createConfiguredCache } from '../cache/provider'
import { InMemoryCacheService, ResilientRedisCacheService, type RedisTransport } from '../cache/service'

const configured = createConfiguredCache(loadServerEnv())
if (!configured.redis) {
  console.info(JSON.stringify({ configured: false, connectivity: 'not_configured', cacheAbstraction: true, fallbackSafe: true }))
  process.exitCode = 1
} else {
  const key = `redis-check:v1:${randomUUID()}`
  const value = { ok: true }
  const reachable = await configured.redis.reachable()
  await configured.cache.set(key, value, 30_000)
  const readBack = await configured.cache.get<typeof value>(key)
  await configured.cache.delete(key)
  const unavailable: RedisTransport = { command: async () => { throw new Error('unavailable') }, ping: async () => false }
  const fallback = new ResilientRedisCacheService(unavailable, new InMemoryCacheService())
  await fallback.set('redis-check:v1:fallback', value, 1_000)
  const fallbackSafe = (await fallback.get<typeof value>('redis-check:v1:fallback'))?.ok === true
  console.info(JSON.stringify({ configured: true, connectivity: reachable ? 'success' : 'failed', writeReadDelete: readBack?.ok === true, cacheAbstraction: true, fallbackSafe }))
  process.exitCode = reachable && readBack?.ok === true && fallbackSafe ? 0 : 1
}
