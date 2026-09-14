export type MapCenter = readonly [longitude: number, latitude: number]
export type PriorityCommunity = { name: string; launchPriority: number; labels: string[]; defaultCenter?: MapCenter }
export type LaunchMarket = { state: string; launchPriority: number; defaultCenter: MapCenter; defaultZoom: number; priorityCommunities: PriorityCommunity[] }

export const NIGERIA_GEOGRAPHY = {
  country: { name: 'Nigeria', code: 'NG', defaultCenter: [8.6753, 9.082] as MapCenter, defaultZoom: 5 },
  launchMarkets: [{
    state: 'Lagos', launchPriority: 1, defaultCenter: [3.3792, 6.5244] as MapCenter, defaultZoom: 10,
    priorityCommunities: [{ name: 'Ojo', launchPriority: 1, defaultCenter: [3.178, 6.462] as MapCenter, labels: ['Ojo', 'Iba', 'Okokomaiko', 'Alaba', 'Ajangbadi', 'Ijanikin', 'Satellite Town', 'Trade Fair area'] }],
  }],
  weatherCheckLocations: [
    { name: 'Lagos', center: [3.3792, 6.5244] as MapCenter },
    { name: 'Ojo', center: [3.178, 6.462] as MapCenter },
    { name: 'Abuja', center: [7.4891, 9.0579] as MapCenter },
  ],
} as const satisfies { country: { name: string; code: 'NG'; defaultCenter: MapCenter; defaultZoom: number }; launchMarkets: readonly LaunchMarket[]; weatherCheckLocations: readonly { name: string; center: MapCenter }[] }

export function discoveryContext(location?: { state?: string; lga?: string; city?: string; neighbourhood?: string; community?: string }) {
  if (!location) return { scope: 'Lagos', center: NIGERIA_GEOGRAPHY.launchMarkets[0].defaultCenter, zoom: NIGERIA_GEOGRAPHY.launchMarkets[0].defaultZoom }
  return { scope: location.community ?? location.neighbourhood ?? location.city ?? location.lga ?? location.state ?? 'Nigeria', center: undefined, zoom: undefined }
}
