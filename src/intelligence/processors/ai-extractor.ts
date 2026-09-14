import type { ExtractedEvent, ExternalEventInput } from '../types'

export interface AiEventExtractor {
  extract(event: ExternalEventInput): Promise<ExtractedEvent>
}

/** Safe fallback: the system never fabricates an event when no approved AI provider is configured. */
export class ReviewRequiredExtractor implements AiEventExtractor {
  async extract(): Promise<ExtractedEvent> {
    return { relevant: false, keywords: [], confidence: 0, needsReview: true, sourcePerspective: 'unclear' }
  }
}

export const AI_EXTRACTION_JSON_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['relevant', 'keywords', 'confidence', 'needsReview'],
  properties: { relevant: { type: 'boolean' }, summary: { type: 'string' }, category: { type: 'string' }, locationText: { type: 'string' }, severity: { type: 'string' }, ongoing: { type: 'boolean' }, sourcePerspective: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number', minimum: 0, maximum: 1 }, needsReview: { type: 'boolean' } }
} as const
