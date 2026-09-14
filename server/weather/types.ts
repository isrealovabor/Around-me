export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy-rain' | 'thunderstorm' | 'unknown'

export type WeatherCoordinates = { latitude: number; longitude: number }

export type LocalWeather = {
  latitude: number
  longitude: number
  timezone: string
  current: {
    temperatureC: number
    feelsLikeC: number
    humidityPercent: number
    precipitationMm: number
    weatherCode: number
    condition: WeatherCondition
    windSpeedKmh: number
    windDirectionDegrees: number
    isDay: boolean
  }
  today: {
    minTemperatureC: number
    maxTemperatureC: number
    precipitationProbabilityPercent: number
    sunrise: string
    sunset: string
  }
}

export type WeatherResult = { status: 'available'; weather: LocalWeather } | { status: 'unavailable' }

export interface WeatherProvider {
  getWeather(coordinates: WeatherCoordinates): Promise<LocalWeather>
}

export class WeatherProviderError extends Error {
  constructor(public readonly kind: 'TIMEOUT' | 'UNAVAILABLE' | 'MALFORMED_RESPONSE') {
    super(kind)
  }
}
