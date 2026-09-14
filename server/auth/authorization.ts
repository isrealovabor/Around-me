import type { MembershipRole, UserRole } from '@prisma/client'
import { forbidden } from '../lib/errors'

export type AuthPrincipal = { userId: string; role: UserRole; status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED' }

export function requireActiveUser(principal: AuthPrincipal) {
  if (principal.status !== 'ACTIVE') throw forbidden('Your account is not active')
  return principal
}

export function requirePlatformRole(principal: AuthPrincipal, minimum: 'ADMIN' | 'SUPER_ADMIN') {
  const allowed = minimum === 'ADMIN' ? ['ADMIN', 'SUPER_ADMIN'] : ['SUPER_ADMIN']
  if (!allowed.includes(principal.role)) throw forbidden()
}

export function canModerateCommunity(principal: AuthPrincipal, membershipRole: MembershipRole | null) {
  return ['ADMIN', 'SUPER_ADMIN'].includes(principal.role) || membershipRole === 'MODERATOR' || membershipRole === 'ADMIN'
}

export function requireOwnership(principal: AuthPrincipal, ownerId: string) {
  if (principal.userId !== ownerId && !['ADMIN', 'SUPER_ADMIN'].includes(principal.role)) throw forbidden()
}
