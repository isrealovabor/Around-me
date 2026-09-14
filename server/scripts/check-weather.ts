import { NIGERIA_GEOGRAPHY } from '../../src/config/geography'
import { OpenMeteoWeatherProvider } from '../weather/open-meteo'
import { AroundMeWeatherService } from '../weather/service'

const service = new AroundMeWeatherService(new OpenMeteoWeatherProvider())
const results = await Promise.all(NIGERIA_GEOGRAPHY.weatherCheckLocations.map(async location => {
  const [longitude, latitude] = location.center
  const result = await service.getWeather({ latitude, longitude })
  return { location: location.name, status: result.status, condition: result.status === 'available' ? result.weather.current.condition : undefined, temperatureC: result.status === 'available' ? result.weather.current.temperatureC : undefined }
}))
const malformedRejected = await service.getWeather({ latitude: 91, longitude: 0 }).then(() => false).catch(() => true)
const providerSafe = await new AroundMeWeatherService({ getWeather: async () => { throw new Error('provider unavailable') } }).getWeather({ latitude: 6.46, longitude: 3.18 })
console.info(JSON.stringify({ provider: 'Open-Meteo', apiKeyRequired: false, results, malformedCoordinatesRejected: malformedRejected, providerFailureSafe: providerSafe.status === 'unavailable' }))
process.exitCode = results.every(result => result.status === 'available') && malformedRejected && providerSafe.status === 'unavailable' ? 0 : 1
