export type WeatherCardData = { temperatureC: number; feelsLikeC: number; precipitationProbabilityPercent: number; condition: string }

const conditionLabel: Record<string, string> = { clear: 'Clear', 'partly-cloudy': 'Partly cloudy', cloudy: 'Cloudy', fog: 'Foggy', drizzle: 'Drizzle', rain: 'Rain', 'heavy-rain': 'Heavy rain', thunderstorm: 'Thunderstorm', unknown: 'Weather unavailable' }

/** Compact presentation component. A community page can supply server-normalized weather when ready. */
export function WeatherCard({ weather, location }: { weather?: WeatherCardData; location?: string }) {
  if (!weather) return <section className="weather-card" aria-live="polite"><p className="eyebrow">LOCAL WEATHER</p><p>Weather is unavailable right now.</p></section>
  return <section className="weather-card" aria-label={`Weather${location ? ` in ${location}` : ''}`}><p className="eyebrow">{location ? `${location.toUpperCase()} WEATHER` : 'LOCAL WEATHER'}</p><div className="weather-reading"><strong>{Math.round(weather.temperatureC)}°C</strong><span>{conditionLabel[weather.condition] ?? 'Weather unavailable'}</span></div><p>Feels like {Math.round(weather.feelsLikeC)}°C <span aria-hidden="true">·</span> Rain {Math.round(weather.precipitationProbabilityPercent)}%</p></section>
}
