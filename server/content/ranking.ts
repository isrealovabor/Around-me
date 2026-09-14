export const FEED_RANKING_WEIGHTS = { reaction: 1, comment: 3, freshnessPerHour: 0.2, verifiedAlert: 50 } as const
export function trendingScore(input: { reactions: number; comments: number; createdAt: Date; urgencyStatus: string }) {
  const ageHours = Math.max(0, (Date.now() - input.createdAt.getTime()) / 3_600_000)
  return Math.max(0, Math.round(input.reactions * FEED_RANKING_WEIGHTS.reaction + input.comments * FEED_RANKING_WEIGHTS.comment - ageHours * FEED_RANKING_WEIGHTS.freshnessPerHour + (input.urgencyStatus === 'VERIFIED_ALERT' ? FEED_RANKING_WEIGHTS.verifiedAlert : 0)))
}
