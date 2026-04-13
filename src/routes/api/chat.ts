import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { createChatService } from '#/chat/service'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const service = createChatService({
          db: getDb(),
          openaiApiKey: env.OPENAI_API_KEY,
          appSecret: env.APP_SECRET,
        })
        return service.handleRequest(request)
      },
    },
  },
})
