import type { NormalizedLocation } from './types'

type MapboxFeature = { id?: string; place_name?: string; properties?: Record<string, unknown>; geometry?: { coordinates?: [number, number] }; coordinates?: { longitude?: number; latitude?: number }; feature_type?: string; place_type?: string[]; text?: string; context?: unknown }
const entries = (feature: MapboxFeature) => [feature, ...(Array.isArray(feature.context) ? feature.context as MapboxFeature[] : Object.values((feature.properties?.context as Record<string, MapboxFeature> | undefined) ?? {}))]
const match = (items: MapboxFeature[], types: string[]) => items.find(item => types.includes(item.feature_type ?? item.place_type?.[0] ?? ''))
const label = (item?: MapboxFeature) => item?.properties?.name as string | undefined ?? item?.text

export function normalizeMapboxFeature(feature: MapboxFeature): NormalizedLocation {
  const items = entries(feature); const country = match(items, ['country']); const region = match(items, ['region']); const district = match(items, ['district']); const place = match(items, ['place', 'locality']); const neighbourhood = match(items, ['neighborhood'])
  const coordinates = feature.geometry?.coordinates ?? (feature.coordinates ? [feature.coordinates.longitude, feature.coordinates.latitude] : undefined)
  return { latitude: coordinates?.[1], longitude: coordinates?.[0], country: label(country), countryCode: country?.properties?.short_code as string | undefined, state: label(region), lga: label(district), city: label(place), town: label(place), district: label(district), neighbourhood: label(neighbourhood), postcode: label(match(items, ['postcode'])), formattedAddress: feature.place_name ?? feature.properties?.full_address as string | undefined, provider: 'mapbox', providerPlaceId: feature.id }
}
