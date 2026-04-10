import { createFileRoute } from '@tanstack/react-router'
import { getCookie } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'

export const Route = createFileRoute('/api/images/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sessionToken = getCookie(SESSION_COOKIE_NAME)
        if (!sessionToken || !validateSessionToken(sessionToken, env.APP_SECRET)) {
          return new Response('Unauthorized', { status: 401 })
        }

        const key = params._splat
        if (!key) {
          return new Response('Not found', { status: 404 })
        }

        const object = await env.R2.get(key)
        if (!object) {
          return new Response('Not found', { status: 404 })
        }

        const headers = new Headers()
        headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/png')
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        return new Response(object.body, { headers })
      },
    },
  },
})
