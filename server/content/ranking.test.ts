import { describe, expect, it } from 'vitest'
import { trendingScore } from './ranking'

describe('feed ranking foundation', () => {
  it('rewards recent engagement and only gives priority to verified alerts', () => {
    const base = { reactions: 2, comments: 1, createdAt: new Date(), urgencyStatus: 'NORMAL' }
    expect(trendingScore({ ...base, urgencyStatus: 'VERIFIED_ALERT' })).toBeGreaterThan(trendingScore({ ...base, urgencyStatus: 'POTENTIALLY_URGENT' }))
  })
})
