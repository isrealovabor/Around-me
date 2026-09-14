import type { NigerianLocation } from '../types'

export interface LocationResolver { resolve(text?: string): Promise<NigerianLocation> }
const knownLocations: Array<{ phrases: string[]; location: NigerianLocation }> = [
  { phrases: ['admiralty way', 'lekki phase 1'], location: { country: 'NG', state: 'Lagos', city: 'Lagos', neighbourhood: 'Lekki Phase 1', latitude: 6.4433, longitude: 3.4726, confidence: .94 } },
  { phrases: ['third mainland bridge'], location: { country: 'NG', state: 'Lagos', city: 'Lagos', confidence: .9 } },
  { phrases: ['wuse 2'], location: { country: 'NG', state: 'FCT', city: 'Abuja', neighbourhood: 'Wuse 2', confidence: .93 } },
  { phrases: ['abuja-kaduna expressway'], location: { country: 'NG', state: 'FCT', city: 'Abuja', confidence: .78 } },
  { phrases: ['ring road, benin', 'ring road benin'], location: { country: 'NG', state: 'Edo', city: 'Benin City', confidence: .9 } }
]
export class NigeriaLocationResolver implements LocationResolver {
  async resolve(text?: string): Promise<NigerianLocation> {
    const normalized = text?.toLowerCase() ?? ''
    const match = knownLocations.find(candidate => candidate.phrases.some(phrase => normalized.includes(phrase)))
    return match ? { ...match.location } : { country: 'NG', confidence: 0 }
  }
}
