import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AnyTextAdapter, StreamChunk, TextOptions } from '@tanstack/ai'
import { createChatService } from '#/chat/service'
import { createTestDb } from '#/test-utils'

const chatStreamSpy = vi.fn<(options: TextOptions) => AsyncIterable<StreamChunk>>(() =>
  (async function* () {
    // Empty stream. Service tests only verify the HTTP plumbing.
  })(),
)
const createOpenaiChatSpy = vi.fn<(model: string, apiKey: string) => void>()

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat: (model: string, apiKey: string) => {
    createOpenaiChatSpy(model, apiKey)
    return {
      kind: 'text',
      name: 'openai',
      model,
      '~types': {} as AnyTextAdapter['~types'],
      chatStream: chatStreamSpy,
      structuredOutput: vi.fn(),
    } as unknown as AnyTextAdapter
  },
}))

const buildRequest = (body: unknown) =>
  new Request('https://example.test/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('createChatService', () => {
  beforeEach(() => {
    chatStreamSpy.mockClear()
    createOpenaiChatSpy.mockClear()
  })

  it('returns a Server-Sent Events response', async () => {
    const db = createTestDb()
    const service = createChatService({ db, openaiApiKey: 'test-key' })

    const response = await service.handleRequest(
      buildRequest({
        messages: [{ role: 'user', content: 'Hej!' }],
        conversationId: 'conv-1',
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
  })

  it('constructs the OpenAI adapter with the configured api key and model', async () => {
    const db = createTestDb()
    const service = createChatService({ db, openaiApiKey: 'sk-test-123' })

    await service.handleRequest(
      buildRequest({
        messages: [{ role: 'user', content: 'Hej!' }],
        conversationId: 'conv-2',
      }),
    )

    expect(createOpenaiChatSpy).toHaveBeenCalledWith('gpt-4.1-mini', 'sk-test-123')
  })

  it('parses the JSON body and forwards messages to the engine/adapter', async () => {
    const db = createTestDb()
    const service = createChatService({ db, openaiApiKey: 'test-key' })

    const response = await service.handleRequest(
      buildRequest({
        messages: [{ role: 'user', content: 'Recept på carbonara?' }],
        conversationId: 'conv-body',
      }),
    )
    // Drain the SSE stream so the engine actually pulls from the adapter.
    await response.text()

    expect(chatStreamSpy).toHaveBeenCalledTimes(1)
    const forwardedMessages = chatStreamSpy.mock.calls[0]![0].messages
    const contents = forwardedMessages.map((m) => m.content)
    expect(contents).toContain('Recept på carbonara?')
  })
})
