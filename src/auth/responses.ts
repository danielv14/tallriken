import { env } from 'cloudflare:workers'
import { verifyPassword, createSessionToken, SESSION_DURATION_SECONDS } from '#/auth/session'
import { serializeSessionCookie, serializeBlankSessionCookie } from '#/auth/cookies'

export const loginWithPassword = (password: string): Response => {
  if (!verifyPassword(password, env.APP_PASSWORD)) {
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
      'Set-Cookie': serializeSessionCookie(token, SESSION_DURATION_SECONDS),
    },
  })
}

export const logoutSession = (): Response => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/login',
      'Set-Cookie': serializeBlankSessionCookie(),
    },
  })
}
