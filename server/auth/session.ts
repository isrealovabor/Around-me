import { SignJWT, jwtVerify } from 'jose'
import type { AuthPrincipal } from './authorization'

const encoder = new TextEncoder()
const audience = 'around-me-api'
const issuer = 'around-me'

export async function createSessionToken(principal: AuthPrincipal, secret: string) {
  return new SignJWT({ role: principal.role, status: principal.status })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(principal.userId)
    .setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('7d')
    .sign(encoder.encode(secret))
}

export async function readSessionToken(token: string, secret: string): Promise<AuthPrincipal> {
  const result = await jwtVerify(token, encoder.encode(secret), { issuer, audience })
  const role = result.payload.role
  const status = result.payload.status
  if (!result.payload.sub || typeof role !== 'string' || typeof status !== 'string') throw new Error('Invalid session payload')
  return { userId: result.payload.sub, role: role as AuthPrincipal['role'], status: status as AuthPrincipal['status'] }
}
