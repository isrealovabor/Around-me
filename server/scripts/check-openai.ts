import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import OpenAI from 'openai'
import { loadServerEnv } from '../config/env'

type ErrorCategory = 'AUTHENTICATION_ERROR' | 'PERMISSION_ERROR' | 'MODEL_ACCESS_ERROR' | 'RATE_LIMIT_ERROR' | 'QUOTA_OR_BILLING_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'INVALID_REQUEST_ERROR' | 'UNKNOWN_OPENAI_ERROR'
const env = loadServerEnv()
const model = process.env.OPENAI_MODEL || 'gpt-5.6-terra'
const require = createRequire(import.meta.url)
const sdkVersion = JSON.parse(readFileSync(join(dirname(require.resolve('openai')), 'package.json'), 'utf8')) as { version: string }
const safeProviderValue = (value: unknown) => typeof value === 'string' && /^[a-z0-9_.-]{1,80}$/i.test(value) ? value : undefined

function classify(error: unknown): { category: ErrorCategory; status?: number; code?: string; type?: string } {
  const candidate = error && typeof error === 'object' ? error as { status?: unknown; code?: unknown; type?: unknown; name?: unknown } : {}
  const status = typeof candidate.status === 'number' ? candidate.status : undefined
  const code = safeProviderValue(candidate.code)
  const type = safeProviderValue(candidate.type)
  if (status === 401) return { category: 'AUTHENTICATION_ERROR', status, code, type }
  if (status === 403 && /model|access/i.test(`${code} ${type}`)) return { category: 'MODEL_ACCESS_ERROR', status, code, type }
  if (status === 403) return { category: 'PERMISSION_ERROR', status, code, type }
  if (status === 429 && /quota|billing|insufficient/i.test(`${code} ${type}`)) return { category: 'QUOTA_OR_BILLING_ERROR', status, code, type }
  if (status === 429) return { category: 'RATE_LIMIT_ERROR', status, code, type }
  if (status === 400) return { category: 'INVALID_REQUEST_ERROR', status, code, type }
  if (status === 408 || /timeout|abort/i.test(`${candidate.name ?? ''}`)) return { category: 'TIMEOUT_ERROR', status, code, type }
  if (!status) return { category: 'NETWORK_ERROR', code, type }
  return { category: 'UNKNOWN_OPENAI_ERROR', status, code, type }
}

async function networkReachable() {
  try {
    await fetch('https://api.openai.com', { method: 'HEAD', signal: AbortSignal.timeout(8_000) })
    return 'YES'
  } catch {
    return 'NO'
  }
}

const report = { OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'PRESENT' : 'MISSING', ENV_FILE: existsSync(`${process.cwd()}/.env`) ? 'LOADED_FROM_SERVER_WORKING_DIRECTORY' : 'MISSING', SDK_VERSION: sdkVersion.version, MODEL: model, HTTP_STATUS: undefined as number | undefined, ERROR_CATEGORY: undefined as ErrorCategory | undefined, PROVIDER_ERROR_CODE: undefined as string | undefined, PROVIDER_ERROR_TYPE: undefined as string | undefined, NETWORK_REACHABLE: 'UNKNOWN' as 'YES' | 'NO' | 'UNKNOWN' }
if (!process.env.OPENAI_API_KEY) {
  report.ERROR_CATEGORY = 'AUTHENTICATION_ERROR'
  console.info(JSON.stringify(report))
  process.exit(1)
}

try {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY!, timeout: 15_000, maxRetries: 0 })
  await client.responses.create({ model, input: 'Reply with OK only.', store: false, max_output_tokens: 32 })
  console.info(JSON.stringify({ ...report, OPENAI_CONNECTIVITY: 'SUCCESS' }))
} catch (error) {
  const result = classify(error)
  report.HTTP_STATUS = result.status
  report.ERROR_CATEGORY = result.category
  report.PROVIDER_ERROR_CODE = result.code
  report.PROVIDER_ERROR_TYPE = result.type
  if (result.category === 'NETWORK_ERROR' || result.category === 'TIMEOUT_ERROR') report.NETWORK_REACHABLE = await networkReachable()
  console.info(JSON.stringify(report))
  process.exit(1)
}
