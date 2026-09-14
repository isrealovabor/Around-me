export interface CacheService {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttlMs: number): Promise<void>
  delete(key: string): Promise<void>
  increment(key: string): Promise<number>
  expire(key: string, ttlMs: number): Promise<void>
}

type Entry = { value: unknown; expiresAt?: number }
export class InMemoryCacheService implements CacheService {
  private readonly entries = new Map<string, Entry>()
  constructor(private readonly now: () => number = Date.now) {}
  async get<T>(key: string): Promise<T | undefined> { const entry = this.entries.get(key); if (!entry) return undefined; if (entry.expiresAt !== undefined && entry.expiresAt <= this.now()) { this.entries.delete(key); return undefined }; return entry.value as T }
  async set<T>(key: string, value: T, ttlMs: number) { this.entries.set(key, { value, expiresAt: this.now() + ttlMs }) }
  async delete(key: string) { this.entries.delete(key) }
  async increment(key: string) { const current = await this.get<number>(key) ?? 0; const next = current + 1; this.entries.set(key, { value: next, expiresAt: this.entries.get(key)?.expiresAt }); return next }
  async expire(key: string, ttlMs: number) { const entry = this.entries.get(key); if (entry) entry.expiresAt = this.now() + ttlMs }
}

export interface RedisTransport { command(parts: string[]): Promise<unknown>; ping(): Promise<boolean> }

/** Upstash REST adapter. Credentials only ever exist in this server-side transport. */
export class UpstashRedisTransport implements RedisTransport {
  constructor(private readonly url: string, private readonly token: string, private readonly fetchImpl: typeof fetch = fetch) {}
  async command(parts: string[]) {
    let response: Response
    try { response = await this.fetchImpl(`${this.url.replace(/\/$/, '')}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify([parts]), signal: AbortSignal.timeout(5_000) }) } catch { throw new Error('REDIS_UNAVAILABLE') }
    if (!response.ok) throw new Error('REDIS_UNAVAILABLE')
    const body = await response.json().catch(() => undefined) as Array<{ result?: unknown; error?: string }> | undefined
    const item = body?.[0]
    if (!item || item.error) throw new Error('REDIS_UNAVAILABLE')
    return item.result
  }
  async ping() { try { return (await this.command(['PING'])) === 'PONG' } catch { return false } }
}

/** Redis first, with an in-memory fallback for non-critical temporary operations. */
export class ResilientRedisCacheService implements CacheService {
  constructor(private readonly redis: RedisTransport, private readonly fallback: CacheService = new InMemoryCacheService()) {}
  async get<T>(key: string): Promise<T | undefined> {
    try { const raw = await this.redis.command(['GET', key]); if (raw === null || raw === undefined) return this.fallback.get<T>(key); if (typeof raw !== 'string') return undefined; try { return JSON.parse(raw) as T } catch { return undefined } } catch { return this.fallback.get<T>(key) }
  }
  async set<T>(key: string, value: T, ttlMs: number) { await this.fallback.set(key, value, ttlMs); try { await this.redis.command(['SET', key, JSON.stringify(value), 'PX', String(ttlMs)]) } catch {} }
  async delete(key: string) { await this.fallback.delete(key); try { await this.redis.command(['DEL', key]) } catch {} }
  async increment(key: string) { try { const result = await this.redis.command(['INCR', key]); const count = Number(result); if (Number.isFinite(count)) return count } catch {} return this.fallback.increment(key) }
  async expire(key: string, ttlMs: number) { await this.fallback.expire(key, ttlMs); try { await this.redis.command(['PEXPIRE', key, String(ttlMs)]) } catch {} }
  async reachable() { return this.redis.ping() }
}
