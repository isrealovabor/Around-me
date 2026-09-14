import { Hono } from 'hono'
import { ApiError } from './lib/errors'
import { databaseIsReachable } from './lib/prisma'
import type { StorageProvider } from './storage/types'
import type { ServerEnv } from './config/env'
import type { TransactionalEmailService } from './email/service'
import { createAuthRoutes } from './routes/auth'
import { ZodError } from 'zod'
import { cors } from 'hono/cors'
import type { AroundMeAiService } from './ai/openai-service'
import type { AroundMeWeatherService } from './weather/service'
import { createWeatherRoutes } from './routes/weather'
import type { ConfiguredCache } from './cache/provider'
import type { RateLimitStore } from './middleware/rate-limit'
import type { NotificationService } from './notifications/service'
import { createNotificationRoutes } from './routes/notifications'
import { createPostRoutes } from './routes/posts'
import { createCommunityRoutes } from './routes/communities'
import type { BackgroundJobQueue } from './jobs/job-queue'

export function createApiApp(dependencies: { storage?: StorageProvider; env?: ServerEnv; email?: TransactionalEmailService; ai?: AroundMeAiService; weather?: AroundMeWeatherService; cache?: ConfiguredCache; rateLimitStore?: RateLimitStore; notifications?: NotificationService; jobs?: BackgroundJobQueue } = {}) {
  const app = new Hono()
  if (dependencies.env) app.use('*', cors({ origin: dependencies.env.CORS_ORIGIN, credentials: true }))
  app.get('/health', context => context.json({ status: 'ok', service: 'around-me-api' }))
  app.get('/health/database', async context => {
    const reachable = await databaseIsReachable()
    return context.json({ status: reachable ? 'ok' : 'unavailable' }, reachable ? 200 : 503)
  })
  app.get('/health/storage', context => context.json({ status: dependencies.storage ? 'configured' : 'unconfigured' }, dependencies.storage ? 200 : 503))
  app.get('/health/email', context => context.json({ status: dependencies.email ? 'configured' : 'unconfigured' }, dependencies.email ? 200 : 503))
  app.get('/health/ai', context => context.json({ status: dependencies.ai ? 'configured' : 'unconfigured', model: dependencies.ai ? dependencies.env?.OPENAI_MODEL : undefined }, dependencies.ai ? 200 : 503))
  app.get('/health/weather', context => context.json({ status: dependencies.weather ? 'configured' : 'unconfigured', provider: dependencies.weather ? 'open-meteo' : undefined }, dependencies.weather ? 200 : 503))
  app.get('/health/redis', async context => {
    const reachable = dependencies.cache?.redis ? await dependencies.cache.redis.reachable() : false
    return context.json({ redis: { configured: Boolean(dependencies.cache?.configured), reachable } }, dependencies.cache?.configured && !reachable ? 503 : 200)
  })
  if (dependencies.env) app.route('/auth', createAuthRoutes({ env: dependencies.env, email: dependencies.email, rateLimitStore: dependencies.rateLimitStore }))
  if (dependencies.env && dependencies.notifications) app.route('/notifications', createNotificationRoutes({ env: dependencies.env, notifications: dependencies.notifications }))
  if (dependencies.env) app.route('/posts', createPostRoutes({ env: dependencies.env, notifications: dependencies.notifications, jobs: dependencies.jobs }))
  if (dependencies.env) app.route('/communities', createCommunityRoutes({ env: dependencies.env }))
  if (dependencies.weather) app.route('/weather', createWeatherRoutes(dependencies.weather))
  app.notFound(context => context.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404))
  app.onError((error, context) => {
    if (error instanceof ApiError) return context.json({ error: { code: error.code, message: error.message } }, error.status)
    if (error instanceof ZodError) return context.json({ error: { code: 'INVALID_INPUT', message: 'Please check the submitted details.' } }, 400)
    console.error(JSON.stringify({ event: 'api_error', message: error.message, path: context.req.path }))
    return context.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, 500)
  })
  return app
}
