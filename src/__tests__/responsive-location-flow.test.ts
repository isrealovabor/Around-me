import { describe, expect, it } from 'vitest'
import { LAGOS_LGAS } from '../config/lagos'
import { filterLocationOptions, findLocationByName, type LocationOption } from '../lib/location-selector'

const options: LocationOption[] = LAGOS_LGAS.map(location => ({ id: location.slug, slug: location.slug, name: `${location.name} LGA`, type: 'LGA' }))
const display = (location: LocationOption) => location.name.replace(/ LGA$/, '')

describe('responsive location selector data flow', () => {
  it('exposes all Lagos LGAs to the same searchable option list on every viewport', () => {
    expect(options).toHaveLength(20)
    expect(filterLocationOptions(options, 'Ike', display).map(display)).toEqual(['Ikeja'])
    expect(filterLocationOptions(options, 'Suru', display).map(display)).toEqual(['Surulere'])
    expect(filterLocationOptions(options, 'Ikoro', display).map(display)).toEqual(['Ikorodu'])
  })

  it('does not fall back to Ojo when another LGA is selected', () => {
    const selected = findLocationByName(options, 'Alimosho', display)
    expect(selected?.slug).toBe('alimosho-lga')
    expect(selected?.slug).not.toBe('ojo-lga')
  })
})
