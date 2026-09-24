import { describe, expect, it } from 'vitest'
import { resolveHomeContext, type CurrentUser } from '../lib/home-context'

const ojo = { id: 'ojo', name: 'Ojo' }
const ikeja = { id: 'ikeja', name: 'Ikeja' }
const user = (primaryCommunity: CurrentUser['primaryCommunity']): CurrentUser => ({ id: 'user-1', name: 'Ada', emailVerified: true, primaryCommunity })

describe('homepage community context', () => {
  it('keeps an unauthenticated visitor generic until they explicitly select a community', () => {
    expect(resolveHomeContext(null, null)).toEqual({ kind: 'visitor', community: null })
    expect(resolveHomeContext(null, ojo)).toEqual({ kind: 'visitor-community', community: ojo })
  })
  it('uses the authenticated user community rather than the public community being viewed', () => {
    expect(resolveHomeContext(user(ikeja), ojo)).toEqual({ kind: 'authenticated-community', community: ikeja })
  })
  it('does not assign a default community to an authenticated user without one', () => {
    expect(resolveHomeContext(user(null), ojo)).toEqual({ kind: 'authenticated-no-community', community: null })
  })
  it('returns to generic visitor context when the authenticated session is cleared', () => {
    expect(resolveHomeContext(null, null)).toEqual({ kind: 'visitor', community: null })
  })
})
