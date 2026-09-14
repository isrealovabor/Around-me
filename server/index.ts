import { serve } from '@hono/node-server'
import { createApiApp } from './app'
import { loadServerEnv } from './config/env'
import { createConfiguredStorageProvider } from './storage/provider'
import { createConfiguredEmailProvider } from './email/provider'
import { TransactionalEmailService } from './email/service'
import { createConfiguredAiService } from './ai/provider'
import { createConfiguredWeatherService } from './weather/provider'
import { createConfiguredCache } from './cache/provider'
import { RedisRateLimitStore } from './middleware/rate-limit'
import { NotificationService } from './notifications/service'
import { InMemoryBackgroundJobQueue } from './jobs/job-queue'

const env = loadServerEnv()
const storage = createConfiguredStorageProvider(env)
const configuredEmailProvider = createConfiguredEmailProvider(env)
const email = configuredEmailProvider ? new TransactionalEmailService(configuredEmailProvider) : undefined
const ai = createConfiguredAiService(env)
const cache = createConfiguredCache(env)
const weather = createConfiguredWeatherService(cache.cache)
const rateLimitStore = new RedisRateLimitStore(cache.cache)
const notificationJobs = new InMemoryBackgroundJobQueue()
const notifications = new NotificationService(notificationJobs)
serve({ fetch: createApiApp({ storage, env, email, ai, weather, cache, rateLimitStore, notifications, jobs: notificationJobs }).fetch, port: env.PORT })
console.info(JSON.stringify({ event: 'api_started', port: env.PORT, environment: env.NODE_ENV, storageConfigured: Boolean(storage), emailConfigured: Boolean(email), aiConfigured: Boolean(ai), weatherConfigured: true, redisConfigured: cache.configured }))
