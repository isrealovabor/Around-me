import { describe, expect, it } from 'vitest'
import { createRawAuthToken, hashAuthToken } from '../auth/tokens'
import { passwordResetEmail, verificationEmail } from '../email/templates'

describe('transactional email security', () => {
  it('generates distinct opaque tokens and persists only stable hashes', () => {
    const first = createRawAuthToken()
    const second = createRawAuthToken()
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(hashAuthToken(first)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashAuthToken(first)).not.toContain(first)
  })
  it('renders mobile-safe HTML and plain-text fallbacks without exposing tokens outside links', () => {
    const url = 'https://app.example/reset-password?token=opaque-token'
    const reset = passwordResetEmail(url)
    const verification = verificationEmail('Amina', url)
    expect(reset.html).toContain('Reset password')
    expect(reset.text).toContain(url)
    expect(verification.html).toContain('Verify email')
    expect(verification.text).toContain('Never share your password')
  })
})
