import { toServerSentEventsResponse } from '@tanstack/ai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import type { Database } from '#/db/types'
import { createChatEngine } from '#/chat/engine'
import type { ChatInput } from '#/chat/types'

export type ChatServiceDeps = {
  db: Database
  openaiApiKey: string
}

export type ChatService = {
  handleRequest: (request: Request) => Promise<Response>
}

export const createChatService = (deps: ChatServiceDeps): ChatService => ({
  handleRequest: async (request) => {
    const { messages, conversationId } = (await request.json()) as ChatInput

    const engine = createChatEngine({
      db: deps.db,
      adapter: createOpenaiChat('gpt-4.1-mini', deps.openaiApiKey),
    })

    const stream = await engine.chat({ messages, conversationId })
    return toServerSentEventsResponse(stream)
  },
})
