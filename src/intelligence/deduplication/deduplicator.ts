import type { ProcessedExternalEvent } from '../types'
const words = (input: string) => new Set(input.toLowerCase().match(/[a-z0-9]+/g) ?? [])
const similarity = (a: Set<string>, b: Set<string>) => { const shared = [...a].filter(word => b.has(word)).length; return shared / Math.max(1, new Set([...a, ...b]).size) }
export function areProbableDuplicates(a: ProcessedExternalEvent, b: ProcessedExternalEvent) {
  if (a.extraction.category !== b.extraction.category) return false
  const sameArea = a.location.neighbourhood && a.location.neighbourhood === b.location.neighbourhood || a.location.city && a.location.city === b.location.city
  const nearInTime = Math.abs(a.fetchedAt.getTime() - b.fetchedAt.getTime()) <= 3 * 60 * 60 * 1000
  return Boolean(sameArea && nearInTime && similarity(words(a.originalTitle), words(b.originalTitle)) >= .22)
}
