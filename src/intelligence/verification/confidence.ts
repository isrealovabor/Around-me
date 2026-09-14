import type { IntelligenceConfidence, SourceTrustLevel } from '../types'
export const confidenceThresholds = { medium: .45, high: .72 }
export function calculateConfidence(input: { trust: SourceTrustLevel; independentSources: number; locationConsistency: number; communityConfirmations: number; officialConfirmation: boolean }): IntelligenceConfidence {
  if (input.officialConfirmation) return 'verified'
  const trust = { official_authority: .7, established_news: .5, verified_local_organisation: .42, community_report: .2, unknown_public: .08 }[input.trust]
  const score = Math.min(1, trust + Math.min(.25, (input.independentSources - 1) * .12) + input.locationConsistency * .15 + Math.min(.12, input.communityConfirmations * .02))
  return score >= confidenceThresholds.high ? 'high' : score >= confidenceThresholds.medium ? 'medium' : 'low'
}
