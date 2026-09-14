import { InMemoryWeatherCache, type WeatherCache } from './cache'
import type { WeatherCoordinates, WeatherProvider, WeatherResult } from './types'
import { CACHE_TTLS_MS, cacheKeys } from '../cache/keys'

export class WeatherValidationError extends Error {}

function validateCoordinates(coordinates: WeatherCoordinates) {
  if (!Number.isFinite(coordinates.latitude) || coordinates.latitude < -90 || coordinates.latitude > 90) throw new WeatherValidationError('Invalid latitude')
  if (!Number.isFinite(coordinates.longitude) || coordinates.longitude < -180 || coordinates.longitude > 180) throw new WeatherValidationError('Invalid longitude')
}

export function weatherCacheKey(coordinates: WeatherCoordinates) {
  return cacheKeys.weather(coordinates.latitude, coordinates.longitude)
}

export class AroundMeWeatherService {
  constructor(private readonly provider: WeatherProvider, private readonly cache: WeatherCache = new InMemoryWeatherCache(), private readonly cacheTtlMs = CACHE_TTLS_MS.weather) {}

  async getWeather(coordinates: WeatherCoordinates): Promise<WeatherResult> {
    validateCoordinates(coordinates)
    const key = weatherCacheKey(coordinates)
    const cached = await this.cache.get<WeatherResult>(key)
    if (cached) return cached
    try {
      const weather = await this.provider.getWeather(coordinates)
      const result: WeatherResult = { status: 'available', weather }
      await this.cache.set(key, result, this.cacheTtlMs)
      return result
    } catch {
      return { status: 'unavailable' }
    }
  }
}
