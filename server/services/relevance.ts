/** Server-side, location-agnostic ranking policy for feeds, alerts and discovery. */
export type LocationScope = 'EXACT_COMMUNITY' | 'NEIGHBOURING_COMMUNITY' | 'SAME_LGA' | 'SAME_CITY' | 'SAME_STATE' | 'OTHER'
export interface RelevanceCandidate { scope: LocationScope; ageMinutes: number; severity?: 'low' | 'medium' | 'high' | 'critical'; distanceKm?: number }

const scopeWeight: Record<LocationScope, number> = { EXACT_COMMUNITY: 100, NEIGHBOURING_COMMUNITY: 78, SAME_LGA: 62, SAME_CITY: 44, SAME_STATE: 28, OTHER: 0 }
const severityWeight = { low: 0, medium: 8, high: 18, critical: 32 }

export function calculateLocationRelevance(candidate: RelevanceCandidate) {
  const freshness = Math.max(0, 30 - Math.min(candidate.ageMinutes / 20, 30))
  const distance = candidate.distanceKm == null ? 0 : Math.max(-20, 10 - candidate.distanceKm)
  return scopeWeight[candidate.scope] + freshness + distance + severityWeight[candidate.severity ?? 'low']
}

export function rankByLocationRelevance<T extends RelevanceCandidate>(items: T[]) {
  return [...items].sort((a, b) => calculateLocationRelevance(b) - calculateLocationRelevance(a))
}
