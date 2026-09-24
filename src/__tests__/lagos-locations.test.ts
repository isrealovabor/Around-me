import { describe, expect, it } from 'vitest'
import { LAGOS_LGAS } from '../config/lagos'

describe('Lagos geographic discovery', () => {
  it('contains the 20 recognised LGAs with unique, broad map centres', () => {
    expect(LAGOS_LGAS).toHaveLength(20)
    expect(new Set(LAGOS_LGAS.map(lga => lga.slug)).size).toBe(20)
    for (const lga of LAGOS_LGAS) {
      expect(lga.center[0]).toBeGreaterThan(2)
      expect(lga.center[0]).toBeLessThan(5)
      expect(lga.center[1]).toBeGreaterThan(6)
      expect(lga.center[1]).toBeLessThan(7)
    }
  })

  it('keeps Ojo as a launch-priority area without excluding other LGAs', () => {
    expect(LAGOS_LGAS.map(lga => lga.name)).toEqual(expect.arrayContaining(['Ojo', 'Ikeja', 'Surulere']))
  })
})
