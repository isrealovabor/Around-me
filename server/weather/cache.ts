import { InMemoryCacheService, type CacheService } from '../cache/service'

/** Compatibility seam for weather; the shared cache can now be Redis-backed. */
export type WeatherCache = CacheService
export class InMemoryWeatherCache extends InMemoryCacheService {}
