import type { ServerEnv } from '../config/env'
import { createResendEmailProvider } from './resend'
import type { EmailProvider } from './types'

export function createConfiguredEmailProvider(env: ServerEnv): EmailProvider | undefined {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return undefined
  return createResendEmailProvider({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, replyTo: env.EMAIL_REPLY_TO })
}
