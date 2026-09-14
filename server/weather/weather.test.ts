import { describe, expect, it } from 'vitest'
import { InMemoryWeatherCache } from './cache'
import { OpenMeteoWeatherProvider, weatherConditionFromCode } from './open-meteo'
import { AroundMeWeatherService } from './service'
import { WeatherProviderError, type LocalWeather } from './types'

const sampleBody = (weatherCode = 2) => ({
  timezone: 'Africa/Lagos',
  current: { temperature_2m: 29, apparent_temperature: 32, relative_humidity_2m: 74, precipitation: 0.2, weather_code: weatherCode, wind_speed_10m: 12, wind_direction_10m: 220, is_day: 1 },
  daily: { temperature_2m_min: [25], temperature_2m_max: [31], precipitation_probability_max: [40], sunrise: ['2026-09-13T06:35'], sunset: ['2026-09-13T18:43'] },
})

describe('Open-Meteo weather provider', () => {
  it('normalizes a valid Open-Meteo response', async () => {
    const provider = new OpenMeteoWeatherProvider(async () => new Response(JSON.stringify(sampleBody())))
    const weather = await provider.getWeather({ latitude: 6.462, longitude: 3.178 })
    expect(weather).toMatchObject({ timezone: 'Africa/Lagos', current: { temperatureC: 29, feelsLikeC: 32, condition: 'partly-cloudy' }, today: { precipitationProbabilityPercent: 40 } })
  })

  it('returns unknown for unrecognized provider weather codes', () => expect(weatherConditionFromCode(999)).toBe('unknown'))

  it('classifies a provider timeout without exposing provider details', async () => {
    const provider = new OpenMeteoWeatherProvider(async () => { throw Object.assign(new Error('timed out'), { name: 'TimeoutError' }) })
    await expect(provider.getWeather({ latitude: 6.46, longitude: 3.18 })).rejects.toMatchObject({ kind: 'TIMEOUT' } satisfies Partial<WeatherProviderError>)
  })

  it('handles provider errors safely at the service boundary', async () => {
    const provider = new OpenMeteoWeatherProvider(async () => new Response('', { status: 503 }))
    await expect(new AroundMeWeatherService(provider).getWeather({ latitude: 6.46, longitude: 3.18 })).resolves.toEqual({ status: 'unavailable' })
  })

  it('rejects invalid latitude and longitude', async () => {
    const service = new AroundMeWeatherService({ getWeather: async () => sampleWeather })
    await expect(service.getWeather({ latitude: 91, longitude: 3 })).rejects.toThrow('Invalid latitude')
    await expect(service.getWeather({ latitude: 6, longitude: 181 })).rejects.toThrow('Invalid longitude')
  })

  it('uses rounded-coordinate cache entries until expiry', async () => {
    let calls = 0; let now = 1_000
    const cache = new InMemoryWeatherCache(() => now)
    const service = new AroundMeWeatherService({ getWeather: async () => { calls++; return sampleWeather } }, cache, 600)
    await service.getWeather({ latitude: 6.462, longitude: 3.178 })
    await service.getWeather({ latitude: 6.463, longitude: 3.179 })
    expect(calls).toBe(1)
    now += 601
    await service.getWeather({ latitude: 6.462, longitude: 3.178 })
    expect(calls).toBe(2)
  })
})

const sampleWeather: LocalWeather = {
  latitude: 6.46, longitude: 3.18, timezone: 'Africa/Lagos',
  current: { temperatureC: 29, feelsLikeC: 32, humidityPercent: 74, precipitationMm: 0, weatherCode: 2, condition: 'partly-cloudy', windSpeedKmh: 12, windDirectionDegrees: 220, isDay: true },
  today: { minTemperatureC: 25, maxTemperatureC: 31, precipitationProbabilityPercent: 40, sunrise: '2026-09-13T06:35', sunset: '2026-09-13T18:43' },
}
