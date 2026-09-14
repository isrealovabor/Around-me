import type { ServerEnv } from '../config/env'
import { createSupabaseStorageProvider } from './supabase-storage'
import type { StorageProvider } from './types'

/**
 * Server composition root for object storage. Client code must never construct
 * this provider because it requires the Supabase server secret credential.
 */
export function createConfiguredStorageProvider(env: ServerEnv): StorageProvider | undefined {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return undefined
  return createSupabaseStorageProvider({ url: env.SUPABASE_URL, secretKey: env.SUPABASE_SECRET_KEY })
}
