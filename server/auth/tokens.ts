import { createHash, randomBytes } from 'node:crypto'

export const AUTH_TOKEN_TYPES = { emailVerification: 'EMAIL_VERIFICATION', passwordReset: 'PASSWORD_RESET' } as const
export function createRawAuthToken() { return randomBytes(32).toString('base64url') }
export function hashAuthToken(token: string) { return createHash('sha256').update(token).digest('hex') }
