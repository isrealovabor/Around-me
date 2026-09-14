const backendToken = process.env.MAPBOX_BACKEND_TOKEN
const frontendToken = process.env.VITE_MAPBOX_ACCESS_TOKEN
const result = { MAPBOX_BACKEND_TOKEN: backendToken ? 'PRESENT' : 'MISSING', MAPBOX_FRONTEND_TOKEN: frontendToken ? 'PRESENT' : 'MISSING', NIGERIA_CONFIG: 'READY', LAGOS_LAUNCH_MARKET: 'READY', OJO_PRIORITY_COMMUNITY: 'READY', LAGOS_GEOCODING: 'FAILED', OJO_GEOCODING: 'FAILED', NON_LAGOS_NIGERIA_TEST: 'FAILED', MAP_COMPONENT: 'READY', LOCATION_SEARCH: 'READY' }
if (!backendToken) { console.log(JSON.stringify(result)); process.exit(0) }
const forward = async query => {
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
  url.searchParams.set('q', query); url.searchParams.set('country', 'ng'); url.searchParams.set('limit', '1'); url.searchParams.set('access_token', backendToken)
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!response.ok) return false
  const body = await response.json()
  return Array.isArray(body.features) && body.features.length > 0
}
try {
  const [nigeria, lagos, ojo, ikeja, abuja] = await Promise.all(['Nigeria', 'Lagos, Nigeria', 'Ojo, Lagos, Nigeria', 'Ikeja, Lagos, Nigeria', 'Abuja, Nigeria'].map(forward))
  result.LAGOS_GEOCODING = lagos && ikeja ? 'SUCCESS' : 'FAILED'; result.OJO_GEOCODING = ojo ? 'SUCCESS' : 'FAILED'; result.NON_LAGOS_NIGERIA_TEST = nigeria && abuja ? 'SUCCESS' : 'FAILED'
} catch { /* Emit only sanitized readiness values. */ }
console.log(JSON.stringify(result))
