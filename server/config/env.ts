import { z } from 'zod'

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DIRECT_URL: z.string().url().startsWith('postgresql://').optional(),
  AUTH_SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  STORAGE_BUCKET_AVATARS: z.string().min(1).optional(),
  STORAGE_BUCKET_POST_IMAGES: z.string().min(1).optional(),
  STORAGE_BUCKET_MARKETPLACE: z.string().min(1).optional(),
  STORAGE_BUCKET_BUSINESSES: z.string().min(1).optional(),
  STORAGE_BUCKET_VERIFICATION: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-5.6-terra'),
  MAPBOX_BACKEND_TOKEN: z.string().min(1).optional(),
  PUSH_PROVIDER_PRIVATE_KEY: z.string().min(1).optional(),
  ENABLE_AI: z.coerce.boolean().default(true),
  ENABLE_EMAIL_DELIVERY: z.coerce.boolean().default(true),
  ENABLE_VERIFICATION: z.coerce.boolean().default(true),
  ENABLE_BUSINESS_CLAIMS: z.coerce.boolean().default(true),
  BETA_MODE: z.coerce.boolean().default(false),
})

export type ServerEnv = z.infer<typeof serverSchema>

/** Parse secrets only in the server process. Never import this module from src/. */
export function loadServerEnv(input: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverSchema.parse(input)
}
