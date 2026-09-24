export type CommunityContext = { id?: string; name: string; slug?: string; location?: { name: string; parentName?: string | null } }
export type CurrentUser = { id: string; name: string; emailVerified: boolean; primaryCommunity: CommunityContext | null; selectedLocation?: string | null }

/** Resolves the three homepage states without ever inferring membership from seed data. */
export function resolveHomeContext(currentUser: CurrentUser | null, viewedCommunity: CommunityContext | null) {
  if (currentUser) {
    const community = currentUser.primaryCommunity ?? (currentUser.selectedLocation ? { name: currentUser.selectedLocation } : null)
    return { kind: community ? 'authenticated-community' as const : 'authenticated-no-community' as const, community }
  }
  return viewedCommunity ? { kind: 'visitor-community' as const, community: viewedCommunity } : { kind: 'visitor' as const, community: null }
}
