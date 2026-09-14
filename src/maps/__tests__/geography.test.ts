import { describe, expect, it } from 'vitest'
import { NIGERIA_GEOGRAPHY, discoveryContext } from '../../config/geography'
import { normalizeMapboxFeature } from '../normalize'

describe('Nigeria maps configuration', () => {
  it('keeps Nigeria nationwide while Lagos and Ojo are launch priorities', () => {
    expect(NIGERIA_GEOGRAPHY.country).toMatchObject({ code: 'NG', name: 'Nigeria' })
    expect(NIGERIA_GEOGRAPHY.launchMarkets[0]).toMatchObject({ state: 'Lagos', launchPriority: 1 })
    expect(NIGERIA_GEOGRAPHY.launchMarkets[0].priorityCommunities[0].name).toBe('Ojo')
    expect(discoveryContext({ state: 'FCT', city: 'Abuja' }).scope).toBe('Abuja')
  })
  it('normalizes optional Mapbox geography without treating a seed label as an administrative boundary', () => {
    const result = normalizeMapboxFeature({ id: 'place.1', place_name: 'Ojo, Lagos, Nigeria', geometry: { coordinates: [3.182, 6.462] }, context: [{ feature_type: 'country', properties: { name: 'Nigeria', short_code: 'ng' } }, { feature_type: 'region', properties: { name: 'Lagos' } }, { feature_type: 'place', properties: { name: 'Ojo' } }] })
    expect(result).toMatchObject({ countryCode: 'ng', state: 'Lagos', city: 'Ojo', provider: 'mapbox' })
    expect(result.lga).toBeUndefined()
  })
})
