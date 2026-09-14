import { describe, expect, it } from 'vitest'
import { AroundMeAiService } from '../ai/openai-service'

describe('OpenAI service safety', () => {
  it('rejects sensitive credential-like content before making an API request', async () => {
    const service = new AroundMeAiService({ apiKey: 'test-key', model: 'gpt-5.6-terra' })
    await expect(service.summarizeCommunityPost('password: should-never-leave-the-server')).rejects.toMatchObject({ code: 'AI_INVALID_INPUT' })
  })
})
