import { WeatherProviderError, type LocalWeather, type WeatherCondition, type WeatherCoordinates, type WeatherProvider } from './types'

type FetchLike = (input: URL, init?: RequestInit) => Promise<Response>

export function weatherConditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle'
  if ([61, 63, 66, 80, 81].includes(code)) return 'rain'
  if ([65, 67, 82].includes(code)) return 'heavy-rain'
  if ([95, 96, 99].includes(code)) return 'thunderstorm'
  return 'unknown'
}

function numberAt(values: unknown, index = 0): number | undefined {
  return Array.isArray(values) && typeof values[index] === 'number' && Number.isFinite(values[index]) ? values[index] : undefined
}

function numberField(record: Record<string, unknown> | undefined, field: string): number | undefined {
  const value = record?.[field]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  constructor(private readonly fetchImpl: FetchLike = fetch, private readonly timeoutMs = 10_000) {}

  async getWeather(coordinates: WeatherCoordinates): Promise<LocalWeather> {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(coordinates.latitude))
    url.searchParams.set('longitude', String(coordinates.longitude))
    url.searchParams.set('timezone', 'auto')
    url.searchParams.set('forecast_days', '1')
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day')
    url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset')
    let response: Response
    try {
      response = await this.fetchImpl(url, { signal: AbortSignal.timeout(this.timeoutMs) })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') throw new WeatherProviderError('TIMEOUT')
      throw new WeatherProviderError('UNAVAILABLE')
    }
    if (!response.ok) throw new WeatherProviderError('UNAVAILABLE')
    let body: Record<string, unknown>
    try { body = await response.json() as Record<string, unknown> } catch { throw new WeatherProviderError('MALFORMED_RESPONSE') }
    const current = body.current as Record<string, unknown> | undefined
    const daily = body.daily as Record<string, unknown> | undefined
    const timezone = typeof body.timezone === 'string' ? body.timezone : undefined
    const temperatureC = numberField(current, 'temperature_2m'); const feelsLikeC = numberField(current, 'apparent_temperature')
    const humidityPercent = numberField(current, 'relative_humidity_2m'); const precipitationMm = numberField(current, 'precipitation')
    const weatherCode = numberField(current, 'weather_code'); const windSpeedKmh = numberField(current, 'wind_speed_10m')
    const windDirectionDegrees = numberField(current, 'wind_direction_10m'); const isDay = numberField(current, 'is_day')
    const min = numberAt(daily?.temperature_2m_min); const max = numberAt(daily?.temperature_2m_max)
    const rainProbability = numberAt(daily?.precipitation_probability_max)
    const sunrise = Array.isArray(daily?.sunrise) && typeof daily.sunrise[0] === 'string' ? daily.sunrise[0] : undefined
    const sunset = Array.isArray(daily?.sunset) && typeof daily.sunset[0] === 'string' ? daily.sunset[0] : undefined
    if (!timezone || temperatureC === undefined || feelsLikeC === undefined || humidityPercent === undefined || precipitationMm === undefined || weatherCode === undefined || windSpeedKmh === undefined || windDirectionDegrees === undefined || isDay === undefined || min === undefined || max === undefined || rainProbability === undefined || !sunrise || !sunset) throw new WeatherProviderError('MALFORMED_RESPONSE')
    return {
      latitude: Math.round(coordinates.latitude * 100) / 100,
      longitude: Math.round(coordinates.longitude * 100) / 100,
      timezone,
      current: {
        temperatureC, feelsLikeC, humidityPercent, precipitationMm, weatherCode, condition: weatherConditionFromCode(weatherCode),
        windSpeedKmh, windDirectionDegrees, isDay: isDay === 1,
      },
      today: { minTemperatureC: min, maxTemperatureC: max, precipitationProbabilityPercent: rainProbability, sunrise, sunset },
    }
  }
}
