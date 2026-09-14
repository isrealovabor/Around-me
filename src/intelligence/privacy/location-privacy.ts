import type { NigerianLocation } from '../types'

/** Remove residential precision before an event is rendered, notified, or shared outside the protected backend. */
export function toPublicLocation(location: NigerianLocation): NigerianLocation {
  const { latitude, longitude, ...area } = location
  return { ...area, confidence: Math.min(location.confidence, .9) }
}

export function canUsePreciseLocation(input: { userOptedIn: boolean; purpose: 'internal_validation' | 'public_display' | 'notification_targeting' }) {
  return input.userOptedIn && input.purpose === 'internal_validation'
}
