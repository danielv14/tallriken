import { createFileRoute } from '@tanstack/react-router'
import { serializeBlankSessionCookie } from '#/auth/cookies'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async () => {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/login',
            'Set-Cookie': serializeBlankSessionCookie(),
          },
        })
      },
    },
  },
})
