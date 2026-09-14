/**
 * Server-side authentication boundary. These contracts are deliberately
 * independent of a UI framework or email provider.
 */
export type AuthTokenType = 'email_verification' | 'password_reset' | 'session_refresh'

export interface RegisterUserInput {
  email: string
  password: string
  name: string
  phoneNumber?: string
  locationId?: string
  communityId?: string
}

export interface AuthenticatedSession {
  userId: string
  email: string
  role: 'USER' | 'COMMUNITY_MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
  expiresAt: string
}

export interface AuthService {
  register(input: RegisterUserInput): Promise<{ userId: string; verificationRequired: true }>
  signIn(email: string, password: string): Promise<AuthenticatedSession>
  signOut(sessionId: string): Promise<void>
  verifyEmail(rawToken: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(rawToken: string, nextPassword: string): Promise<void>
}

/** Security requirements for the eventual server implementation.
 * - store only password hashes (Argon2id recommended), never raw passwords
 * - hash one-time email/reset tokens before persisting them in AuthToken
 * - rate-limit sign-in, verification and reset endpoints
 * - use HttpOnly, Secure, SameSite session cookies
 */
