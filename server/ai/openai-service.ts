import OpenAI from 'openai'

export type AroundMeAiTask = 'post_summary' | 'post_category' | 'urgent_alert_review' | 'post_cleanup' | 'area_summary' | 'moderation_review' | 'connectivity_check'
export type AroundMeAiConfig = { apiKey: string; model: string }

const MAX_INPUT_CHARS = 5_000
const MAX_OUTPUT_TOKENS = 500
const blockedSecretPatterns = [/\bsk-[A-Za-z0-9_-]{16,}/i, /\b(?:password|session[_ -]?secret|access[_ -]?token)\s*[:=]/i, /-----BEGIN [A-Z ]+PRIVATE KEY-----/]
const redactPersonalData = (input: string) => input
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted email]')
  .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted phone]')

export class AroundMeAiError extends Error {
  constructor(public readonly code: 'AI_UNAVAILABLE' | 'AI_TIMEOUT' | 'AI_INVALID_INPUT', message: string) { super(message) }
}

/** Server-only gateway for future community intelligence. Never send private credentials or documents here. */
export class AroundMeAiService {
  private readonly client: OpenAI
  constructor(private readonly config: AroundMeAiConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, timeout: 15_000, maxRetries: 0 })
  }
  private validateInput(input: string) {
    if (!input.trim() || input.length > MAX_INPUT_CHARS || blockedSecretPatterns.some(pattern => pattern.test(input))) throw new AroundMeAiError('AI_INVALID_INPUT', 'AI input is missing, too long, or contains disallowed sensitive data.')
  }
  private async run(task: AroundMeAiTask, instructions: string, input: string, maxOutputTokens = 250) {
    this.validateInput(input)
    const safeInput = redactPersonalData(input)
    try {
      const response = await this.client.responses.create({ model: this.config.model, instructions, input: safeInput, max_output_tokens: Math.min(Math.max(maxOutputTokens, 32), MAX_OUTPUT_TOKENS), store: false })
      if (!response.output_text?.trim()) throw new AroundMeAiError('AI_UNAVAILABLE', 'AI returned no usable text.')
      return { task, model: this.config.model, text: response.output_text.trim(), responseId: response.id }
    } catch (error) {
      if (error instanceof AroundMeAiError) throw error
      if (error instanceof Error && /timeout|abort/i.test(error.message)) throw new AroundMeAiError('AI_TIMEOUT', 'AI request timed out.')
      throw new AroundMeAiError('AI_UNAVAILABLE', 'AI service is unavailable.')
    }
  }
  summarizeCommunityPost(postText: string) { return this.run('post_summary', 'Summarize this community post in one neutral sentence. Preserve uncertainty and do not claim unverified reports are facts.', postText, 100) }
  categorizeCommunityPost(postText: string) { return this.run('post_category', 'Classify this community post as exactly one of: crime/safety, traffic, utilities, community, events, marketplace, lost & found, emergency, other. Reply with only the category.', postText, 32) }
  reviewUrgency(postText: string) { return this.run('urgent_alert_review', 'Assess whether this post may need urgent human review. Reply with a concise explanation that it is not verification of facts.', postText, 120) }
  improveCommunityPost(postText: string) { return this.run('post_cleanup', 'Improve clarity and grammar while preserving meaning, uncertainty, and the author’s tone. Do not add facts, names, or precise locations.', postText, 300) }
  summarizeLocalArea(records: string) { return this.run('area_summary', 'Create a short, cautious local-area summary based only on the supplied records. Attribute reports and do not infer missing facts.', records, 300) }
  reviewModerationContent(postText: string) { return this.run('moderation_review', 'Identify possible spam, harassment, dangerous misinformation, or privacy concerns for a human moderator. Do not make a final moderation decision.', postText, 180) }
  connectivityCheck() { return this.run('connectivity_check', 'Reply exactly: Around Me AI connected.', 'Safe connectivity check. No user or community data is included.', 32) }
}
