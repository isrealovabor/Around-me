import type { CommunityTarget, NigerianLocation } from '../types'
export function targetCommunities(event: NigerianLocation, communities: CommunityTarget[], severity: 'low' | 'medium' | 'high' | 'critical') {
  return communities.filter(community => {
    if (event.state && community.state !== event.state) return false
    if (event.city && community.city !== event.city) return false
    if (!event.latitude || !event.longitude || !community.latitude || !community.longitude) return true
    const distanceKm = Math.hypot((event.latitude - community.latitude) * 111, (event.longitude - community.longitude) * 111)
    return distanceKm <= ({ low: 3, medium: 8, high: 15, critical: 30 }[severity])
  })
}
