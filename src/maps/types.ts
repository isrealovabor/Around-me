export type NormalizedLocation = {
  latitude?: number; longitude?: number; country?: string; countryCode?: string; state?: string; lga?: string; city?: string; town?: string; district?: string; neighbourhood?: string; community?: string; postcode?: string; formattedAddress?: string; provider: 'mapbox'; providerPlaceId?: string
}
export type LocationSearchOptions = { proximity?: readonly [longitude: number, latitude: number]; bbox?: readonly [number, number, number, number]; limit?: number }
export type MapSelection = { precise: { latitude: number; longitude: number }; public: Pick<NormalizedLocation, 'country' | 'countryCode' | 'state' | 'lga' | 'city' | 'town' | 'district' | 'neighbourhood' | 'community'> }
