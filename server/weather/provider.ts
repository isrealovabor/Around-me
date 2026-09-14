import { OpenMeteoWeatherProvider } from './open-meteo'
import { AroundMeWeatherService } from './service'
import type { CacheService } from '../cache/service'

/** Composition root for weather. Open-Meteo requires no API key. */
export function createConfiguredWeatherService(cache?: CacheService) {
  return new AroundMeWeatherService(new OpenMeteoWeatherProvider(), cache)
}
