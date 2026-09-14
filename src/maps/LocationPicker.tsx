import { lazy, Suspense, useState } from 'react'
import { Crosshair, Search } from 'lucide-react'
import { NIGERIA_GEOGRAPHY } from '../config/geography'
import { normalizeMapboxFeature } from './normalize'
import { mapboxAccessToken } from './config'
import type { NormalizedLocation } from './types'

const LazyMapView = lazy(() => import('./MapView').then(module => ({ default: module.MapView })))

type MapboxResponse = { features?: unknown[] }
const labelFor = (location: NormalizedLocation) => location.neighbourhood ?? location.city ?? location.town ?? location.district ?? location.state ?? location.country ?? 'Selected location'

async function geocode(path: 'forward' | 'reverse', params: Record<string, string>) {
  if (!mapboxAccessToken) throw new Error('Map search is not configured.')
  const url = new URL(`https://api.mapbox.com/search/geocode/v6/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value)); url.searchParams.set('country', 'ng'); url.searchParams.set('access_token', mapboxAccessToken)
  const response = await fetch(url); if (!response.ok) throw new Error('Location search is temporarily unavailable.')
  const body = await response.json() as MapboxResponse
  return (body.features ?? []).map(feature => normalizeMapboxFeature(feature as Parameters<typeof normalizeMapboxFeature>[0]))
}

/** Optional onboarding picker: GPS is requested only after the user presses the button. */
export function LocationPicker({ onSelect }: { onSelect: (location: NormalizedLocation) => void }) {
  const [query, setQuery] = useState(''); const [results, setResults] = useState<NormalizedLocation[]>([]); const [selected, setSelected] = useState<NormalizedLocation>(); const [status, setStatus] = useState('')
  const choose = (location: NormalizedLocation) => { setSelected(location); onSelect(location); setStatus(`${labelFor(location)} selected. Your exact coordinates are not shown publicly.`) }
  const search = async () => { try { setStatus('Searching Nigeria…'); setResults(await geocode('forward', { q: query, limit: '5', proximity: NIGERIA_GEOGRAPHY.launchMarkets[0].defaultCenter.join(',') })); setStatus('') } catch (error) { setStatus(error instanceof Error ? error.message : 'Location search is unavailable.') } }
  const reverse = async (longitude: number, latitude: number) => { try { const [location] = await geocode('reverse', { longitude: String(longitude), latitude: String(latitude) }); if (location) choose(location) } catch { setStatus('We could not identify that location.') } }
  const useCurrentLocation = () => { if (!navigator.geolocation) { setStatus('Current location is not supported by this browser.'); return } navigator.geolocation.getCurrentPosition(position => void reverse(position.coords.longitude, position.coords.latitude), () => setStatus('Location permission was not granted. You can still search or tap the map.'), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }) }
  return <section className="location-picker"><div className="location-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Nigerian area, town, city, LGA or state"/><button type="button" onClick={search} disabled={query.trim().length < 2}><Search size={15}/> Search</button><button type="button" onClick={useCurrentLocation}><Crosshair size={15}/> Use current location</button></div><Suspense fallback={<div className="map-loading">Loading map…</div>}><LazyMapView center={NIGERIA_GEOGRAPHY.launchMarkets[0].defaultCenter} zoom={NIGERIA_GEOGRAPHY.launchMarkets[0].defaultZoom} selected={selected?.latitude !== undefined && selected.longitude !== undefined ? { latitude: selected.latitude, longitude: selected.longitude } : undefined} onSelect={coordinates => void reverse(coordinates.longitude, coordinates.latitude)}/></Suspense>{results.length > 0 && <div className="location-results">{results.map((location, index) => <button type="button" key={`${location.providerPlaceId ?? labelFor(location)}-${index}`} onClick={() => choose(location)}>{labelFor(location)}<small>{[location.state, location.country].filter(Boolean).join(', ')}</small></button>)}</div>}{status && <small className="location-status">{status}</small>}<small>GPS is optional. You can search Nigeria manually or tap the map. Only your selected community or area is shown publicly.</small></section>
}
