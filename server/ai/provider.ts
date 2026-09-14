import type { ServerEnv } from '../config/env'
import { AroundMeAiService } from './openai-service'

/** Composition root: OpenAI is initialized once, server-side only. */
export function createConfiguredAiService(env: ServerEnv) {
  if (!env.OPENAI_API_KEY) return undefined
  return new AroundMeAiService({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL })
}
