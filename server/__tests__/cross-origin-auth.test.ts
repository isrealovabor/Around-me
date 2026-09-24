import { describe, expect, it } from 'vitest'
import { createAuthRoutes, sessionCookieOptions } from '../routes/auth'

const env = (NODE_ENV: 'development' | 'production') => ({ NODE_ENV, APP_URL: NODE_ENV === 'production' ? 'https://app.vercel.app' : 'http://localhost:5173', CORS_ORIGIN: NODE_ENV === 'production' ? 'https://app.vercel.app' : 'http://localhost:5173' }) as never

describe('cross-origin session cookie policy', () => {
  it('uses secure HttpOnly cross-site cookies in production', () => expect(sessionCookieOptions(env('production'))).toMatchObject({ httpOnly: true, secure: true, sameSite: 'None' }))
  it('keeps localhost development cookies secure-by-default for HTTP', () => expect(sessionCookieOptions(env('development'))).toMatchObject({ httpOnly: true, secure: false, sameSite: 'Lax' }))
  it('treats a browser without a valid session cookie as unauthenticated', async () => {
    const response = await createAuthRoutes({ env: env('development') }).request('/session')
    await expect(response.json()).resolves.toEqual({ authenticated: false })
  })
})
