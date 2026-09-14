import type { ServerEnv } from '../config/env'
import { InMemoryCacheService, ResilientRedisCacheService, UpstashRedisTransport, type CacheService } from './service'

export type ConfiguredCache = { cache: CacheService; redis?: ResilientRedisCacheService; configured: boolean }
export function createConfiguredCache(env: ServerEnv): ConfiguredCache {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new ResilientRedisCacheService(new UpstashRedisTransport(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN))
    return { cache: redis, redis, configured: true }
  }
  return { cache: new InMemoryCacheService(), configured: false }
}
