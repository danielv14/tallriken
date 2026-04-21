import type { AnyTextAdapter } from '@tanstack/ai'
import type { Database } from '#/db/types'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'tool'
  content: string
}

export type ChatInput = {
  messages: ChatMessage[]
  conversationId: string
}

export type ChatEngineDeps = {
  db: Database
  adapter: AnyTextAdapter
}
