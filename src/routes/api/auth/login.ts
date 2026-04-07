import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { verifyPassword, createSessionToken } from '#/auth/session'
import { serializeSessionCookie } from '#/auth/cookies'

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const password = formData.get('password')

        if (typeof password !== 'string' || !verifyPassword(password, env.APP_PASSWORD)) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
          })
        }

        const token = createSessionToken(env.APP_SECRET)

        return new Response(null, {
          status: 302,
          headers: {
            Location: '/',
            'Set-Cookie': serializeSessionCookie(token, THIRTY_DAYS_SECONDS),
          },
        })
      },
    },
  },
})
