import { loadServerEnv } from '../config/env'
import { databaseIsReachable } from '../lib/prisma'
import { createConfiguredCache } from '../cache/provider'

const env = loadServerEnv(); const cache = createConfiguredCache(env)
const report = { env: 'configured', database: await databaseIsReachable(), redis: cache.redis ? await cache.redis.reachable() : 'optional_unconfigured', storage: Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY), cors: Boolean(env.CORS_ORIGIN), session: env.AUTH_SESSION_SECRET.length >= 32, aiConfigured: Boolean(env.OPENAI_API_KEY && env.ENABLE_AI), emailConfigured: Boolean(env.RESEND_API_KEY && env.ENABLE_EMAIL_DELIVERY), productionEmail: 'PENDING_DOMAIN', betaMode: env.BETA_MODE, pending: ['Production domain and verified Resend sender'] }
console.info(JSON.stringify(report)); process.exitCode = report.database && report.storage && report.cors && report.session ? 0 : 1
