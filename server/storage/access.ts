import type { AuthPrincipal } from '../auth/authorization'
import { forbidden } from '../lib/errors'

/** Verification evidence is never readable by the uploader via a public URL. */
export function requireVerificationDocumentAccess(principal: AuthPrincipal, canModerateSubject = false) {
  if (['ADMIN', 'SUPER_ADMIN'].includes(principal.role) || (principal.role === 'COMMUNITY_MODERATOR' && canModerateSubject)) return
  throw forbidden('You do not have permission to access verification evidence')
}
