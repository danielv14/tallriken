import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'

export const getIsAuthenticated = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionToken = getCookie(SESSION_COOKIE_NAME)

  if (!sessionToken) {
    return false
  }

  return validateSessionToken(sessionToken, env.APP_SECRET)
})
