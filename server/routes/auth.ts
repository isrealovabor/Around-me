import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { Prisma } from '@prisma/client'
import type { ServerEnv } from '../config/env'
import { hashPassword, verifyPassword } from '../auth/password'
import { createSessionToken } from '../auth/session'
import { AUTH_TOKEN_TYPES, createRawAuthToken, hashAuthToken } from '../auth/tokens'
import { ApiError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { MemoryRateLimitStore, enforceRateLimit, RATE_LIMITS, type RateLimitStore } from '../middleware/rate-limit'
import type { TransactionalEmailService } from '../email/service'
import { loginInput, registerInput, resetPasswordInput, resetRequestInput, tokenInput } from '../validators/auth'

const verificationLifetimeMs = 24 * 60 * 60 * 1000
const resetLifetimeMs = 60 * 60 * 1000
const genericResetResponse = { message: "If an account exists for that email, we've sent a reset link." }
export function sessionCookieOptions(env: ServerEnv) {
  const production = env.NODE_ENV === 'production'
  return { httpOnly: true, secure: production, sameSite: production ? 'None' as const : 'Lax' as const, path: '/', maxAge: 7 * 24 * 60 * 60 }
}
function requireTrustedOrigin(context: { req: { header(name: string): string | undefined } }, env: ServerEnv) {
  const origin = context.req.header('origin')
  if (origin && origin !== env.CORS_ORIGIN) throw new ApiError(403, 'Request origin is not allowed', 'ORIGIN_FORBIDDEN')
}

function emailUrl(appUrl: string, path: string, token: string) { const url = new URL(path, appUrl); url.searchParams.set('token', token); return url.toString() }
async function replaceToken(userId: string, type: string, rawToken: string, expiresInMs: number) {
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, consumedAt: null } }),
    prisma.authToken.create({ data: { userId, type, tokenHash: hashAuthToken(rawToken), expiresAt: new Date(Date.now() + expiresInMs) } }),
  ])
}

export function createAuthRoutes(dependencies: { env: ServerEnv; email?: TransactionalEmailService; rateLimitStore?: RateLimitStore }) {
  const app = new Hono()
  const rateLimitStore = dependencies.rateLimitStore ?? new MemoryRateLimitStore()
  const requireEmail = () => { if (!dependencies.email) throw new ApiError(503, 'Email delivery is not configured', 'EMAIL_NOT_CONFIGURED'); return dependencies.email }
  app.post('/register', async context => {
    requireTrustedOrigin(context, dependencies.env)
    const input = registerInput.parse(await context.req.json())
    await enforceRateLimit(rateLimitStore, `registration:${input.email.trim().toLowerCase()}`, RATE_LIMITS.registration.limit, RATE_LIMITS.registration.windowSeconds)
    requireEmail()
    try {
      const user = await prisma.user.create({ data: { email: input.email, passwordHash: await hashPassword(input.password), name: input.displayName, profile: { create: { displayName: input.displayName } } } })
      const rawToken = createRawAuthToken()
      await replaceToken(user.id, AUTH_TOKEN_TYPES.emailVerification, rawToken, verificationLifetimeMs)
      const delivered = await dependencies.email!.sendEmailVerification(user, emailUrl(dependencies.env.APP_URL, '/verify-email', rawToken))
      return context.json({ message: delivered ? 'Account created. Check your email to verify it.' : 'Account created, but we could not deliver the verification email. Please request another verification email.', emailDelivery: delivered ? 'sent' : 'failed' }, 201)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ApiError(409, 'An account already exists for this email', 'EMAIL_IN_USE')
      throw error
    }
  })
  app.post('/resend-verification', async context => {
    requireTrustedOrigin(context, dependencies.env)
    const { email } = resetRequestInput.parse(await context.req.json())
    await enforceRateLimit(rateLimitStore, `resend-verification:${email.trim().toLowerCase()}`, RATE_LIMITS.resendVerification.limit, RATE_LIMITS.resendVerification.windowSeconds)
    requireEmail()
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !user.emailVerifiedAt && dependencies.email) {
      const rawToken = createRawAuthToken(); await replaceToken(user.id, AUTH_TOKEN_TYPES.emailVerification, rawToken, verificationLifetimeMs)
      await dependencies.email.sendEmailVerification(user, emailUrl(dependencies.env.APP_URL, '/verify-email', rawToken))
    }
    return context.json({ message: 'If an unverified account exists for that email, we have sent a verification link.' })
  })
  app.get('/verify-email', async context => {
    const { token } = tokenInput.parse({ token: context.req.query('token') })
    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashAuthToken(token) }, include: { user: { include: { profile: { include: { primaryCommunity: true } } } } } })
    if (!record || record.type !== AUTH_TOKEN_TYPES.emailVerification || record.consumedAt || record.expiresAt <= new Date()) throw new ApiError(400, 'This verification link is invalid or expired', 'INVALID_VERIFICATION_TOKEN')
    await prisma.$transaction([prisma.authToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }), prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } })])
    void dependencies.email?.sendWelcomeEmail(record.user, record.user.profile?.primaryCommunity?.name)
    return context.json({ message: 'Your email has been verified.' })
  })
  app.post('/forgot-password', async context => {
    requireTrustedOrigin(context, dependencies.env)
    const { email } = resetRequestInput.parse(await context.req.json())
    await enforceRateLimit(rateLimitStore, `password-reset:${email.trim().toLowerCase()}`, RATE_LIMITS.passwordReset.limit, RATE_LIMITS.passwordReset.windowSeconds)
    requireEmail()
    const user = await prisma.user.findUnique({ where: { email } })
    if (user?.passwordHash && dependencies.email) {
      const rawToken = createRawAuthToken(); await replaceToken(user.id, AUTH_TOKEN_TYPES.passwordReset, rawToken, resetLifetimeMs)
      await dependencies.email.sendPasswordReset(user, emailUrl(dependencies.env.APP_URL, '/reset-password', rawToken))
    }
    return context.json(genericResetResponse)
  })
  app.post('/reset-password', async context => {
    requireTrustedOrigin(context, dependencies.env)
    const input = resetPasswordInput.parse(await context.req.json())
    await enforceRateLimit(rateLimitStore, `reset-attempt:${hashAuthToken(input.token)}`, RATE_LIMITS.resetAttempt.limit, RATE_LIMITS.resetAttempt.windowSeconds)
    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashAuthToken(input.token) }, include: { user: true } })
    if (!record || record.type !== AUTH_TOKEN_TYPES.passwordReset || record.consumedAt || record.expiresAt <= new Date()) throw new ApiError(400, 'This reset link is invalid or expired', 'INVALID_RESET_TOKEN')
    const now = new Date()
    await prisma.$transaction([prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(input.password) } }), prisma.authToken.update({ where: { id: record.id }, data: { consumedAt: now } }), prisma.authToken.deleteMany({ where: { userId: record.userId, type: AUTH_TOKEN_TYPES.passwordReset, id: { not: record.id } } })])
    void dependencies.email?.sendPasswordChangedNotice(record.user, now.toISOString())
    return context.json({ message: 'Your password has been reset. You can now sign in.' })
  })
  app.post('/login', async context => {
    requireTrustedOrigin(context, dependencies.env)
    const input = loginInput.parse(await context.req.json())
    await enforceRateLimit(rateLimitStore, `login:${input.email.trim().toLowerCase()}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowSeconds)
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user?.passwordHash || !await verifyPassword(input.password, user.passwordHash)) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    if (user.status !== 'ACTIVE') throw new ApiError(403, 'Your account is not active', 'ACCOUNT_INACTIVE')
    const token = await createSessionToken({ userId: user.id, role: user.role, status: user.status }, dependencies.env.AUTH_SESSION_SECRET)
    setCookie(context, 'around_me_session', token, sessionCookieOptions(dependencies.env))
    return context.json({ message: user.emailVerifiedAt ? 'Signed in.' : 'Please verify your email before participating in your community.', emailVerified: Boolean(user.emailVerifiedAt) })
  })
  app.post('/logout', context => {
    requireTrustedOrigin(context, dependencies.env)
    const options = sessionCookieOptions(dependencies.env)
    deleteCookie(context, 'around_me_session', { path: options.path, secure: options.secure, sameSite: options.sameSite })
    return context.json({ message: 'Signed out.' })
  })
  return app
}
