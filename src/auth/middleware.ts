import { createMiddleware } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const sessionToken = getCookie(SESSION_COOKIE_NAME)

  if (!sessionToken || !validateSessionToken(sessionToken, env.APP_SECRET)) {
    throw new Error('Unauthorized')
  }

  return await next()
})
