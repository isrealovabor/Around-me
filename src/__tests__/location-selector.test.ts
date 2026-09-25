import { describe, expect, it } from 'vitest'
import { filterLocationOptions, findLocationByName, type LocationOption } from '../lib/location-selector'

const lagosLgas: LocationOption[] = ['Agege', 'Ikeja', 'Ikorodu', 'Ojo', 'Surulere'].map(name => ({ id: name.toLowerCase(), name: `${name} LGA`, slug: `${name.toLowerCase()}-lga`, type: 'LGA' }))

describe('database-backed location selection', () => {
  it('selects Lagos LGAs without an Ojo fallback', () => {
    expect(findLocationByName(lagosLgas, 'Ikeja', location => location.name.replace(/ LGA$/, ''))?.slug).toBe('ikeja-lga')
    expect(findLocationByName(lagosLgas, 'Surulere', location => location.name.replace(/ LGA$/, ''))?.slug).toBe('surulere-lga')
    expect(findLocationByName(lagosLgas, 'Ikorodu', location => location.name.replace(/ LGA$/, ''))?.slug).toBe('ikorodu-lga')
    expect(findLocationByName(lagosLgas, 'Ojo', location => location.name.replace(/ LGA$/, ''))?.slug).toBe('ojo-lga')
  })

  it('filters the current state’s database results for searchable selection', () => {
    const label = (location: LocationOption) => location.name.replace(/ LGA$/, '')
    expect(filterLocationOptions(lagosLgas, 'Ike', label).map(location => location.slug)).toEqual(['ikeja-lga'])
    expect(filterLocationOptions(lagosLgas, 'Suru', label).map(location => location.slug)).toEqual(['surulere-lga'])
    expect(filterLocationOptions(lagosLgas, 'Ojo', label).map(location => location.slug)).toEqual(['ojo-lga'])
  })
})
