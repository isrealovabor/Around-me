import { Hono } from 'hono'
import { z } from 'zod'
import type { AroundMeWeatherService } from '../weather/service'

const weatherQuery = z.object({ latitude: z.coerce.number().finite().min(-90).max(90), longitude: z.coerce.number().finite().min(-180).max(180) })

export function createWeatherRoutes(weather: AroundMeWeatherService) {
  const app = new Hono()
  app.get('/', async context => {
    const coordinates = weatherQuery.parse(context.req.query())
    const result = await weather.getWeather(coordinates)
    return result.status === 'available' ? context.json(result) : context.json({ status: 'unavailable' as const }, 503)
  })
  return app
}
