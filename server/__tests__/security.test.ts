import { describe, expect, it } from 'vitest'
import { canModerateCommunity, requireOwnership, requirePlatformRole, type AuthPrincipal } from '../auth/authorization'
import { hashPassword, verifyPassword } from '../auth/password'
import { createSessionToken, readSessionToken } from '../auth/session'
import { MemoryRateLimitStore, enforceRateLimit } from '../middleware/rate-limit'
import { rankByLocationRelevance } from '../services/relevance'
import { requireVerificationDocumentAccess } from '../storage/access'
import { createObjectKey, validateUpload } from '../storage/validation'

const user: AuthPrincipal = { userId: 'user-1', role: 'USER', status: 'ACTIVE' }
const admin: AuthPrincipal = { userId: 'admin-1', role: 'ADMIN', status: 'ACTIVE' }

describe('server security foundation', () => {
  it('hashes a password and never treats the original value as its stored hash', async () => {
    const passwordHash = await hashPassword('a secure test password')
    expect(passwordHash).not.toBe('a secure test password')
    await expect(verifyPassword('a secure test password', passwordHash)).resolves.toBe(true)
    await expect(verifyPassword('incorrect password', passwordHash)).resolves.toBe(false)
  })
  it('signs and validates a server session payload', async () => {
    const secret = 'this-is-a-test-secret-with-more-than-32-characters'
    const token = await createSessionToken(user, secret)
    await expect(readSessionToken(token, secret)).resolves.toEqual(user)
  })
  it('does not grant users administrative or ownership authority', () => {
    expect(() => requirePlatformRole(user, 'ADMIN')).toThrow('permission')
    expect(() => requireOwnership(user, 'someone-else')).toThrow('permission')
    expect(canModerateCommunity(user, null)).toBe(false)
    expect(canModerateCommunity(admin, null)).toBe(true)
  })
  it('enforces a backend rate limit', async () => {
    const store = new MemoryRateLimitStore()
    await enforceRateLimit(store, 'login:user@example.test', 1, 60)
    await expect(enforceRateLimit(store, 'login:user@example.test', 1, 60)).rejects.toMatchObject({ status: 429 })
  })
  it('ranks exact-community and severe nearby content ahead of broader content', () => {
    const ranked = rankByLocationRelevance([
      { id: 'state', scope: 'SAME_STATE' as const, ageMinutes: 5 },
      { id: 'area', scope: 'EXACT_COMMUNITY' as const, ageMinutes: 80 },
      { id: 'critical-lga', scope: 'SAME_LGA' as const, ageMinutes: 5, severity: 'critical' as const },
    ])
    expect(ranked.map(item => item.id)).toEqual(['area', 'critical-lga', 'state'])
  })
  it('rejects invalid uploads and generates server-owned object keys', () => {
    expect(() => validateUpload({
      bucket: 'avatars', ownerId: 'user-1', filename: 'avatar.png', contentType: 'image/png', bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x01]),
    })).not.toThrow()
    expect(() => validateUpload({
      bucket: 'avatars', ownerId: 'user-1', filename: 'not-a-png.png', contentType: 'image/png', bytes: new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
    })).toThrow('content does not match')
    expect(() => validateUpload({
      bucket: 'avatars', ownerId: '../user-1', filename: 'avatar.png', contentType: 'image/png', bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x01]),
    })).toThrow('Invalid upload owner')
    expect(createObjectKey('verificationDocuments', 'user-1', 'application/pdf')).toMatch(/^verificationDocuments\/user-1\/.+\.pdf$/)
  })
  it('does not let ordinary users access verification documents', () => {
    expect(() => requireVerificationDocumentAccess(user)).toThrow('permission')
    expect(() => requireVerificationDocumentAccess(admin)).not.toThrow()
    expect(() => requireVerificationDocumentAccess({ ...user, role: 'COMMUNITY_MODERATOR' }, true)).not.toThrow()
  })
})
