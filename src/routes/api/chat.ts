import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { createChatService } from '#/chat/service'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'
import { parseCookie } from '#/auth/parse-cookie'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookieHeader = request.headers.get('cookie') ?? ''
        const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE_NAME)

        if (!sessionToken || !validateSessionToken(sessionToken, env.APP_SECRET)) {
          return new Response('Unauthorized', { status: 401 })
        }

        const service = createChatService({
          db: getDb(),
          openaiApiKey: env.OPENAI_API_KEY,
        })
        return service.handleRequest(request)
      },
    },
  },
})
