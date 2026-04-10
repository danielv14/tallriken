import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { loginWithPassword } from '#/auth/responses'
import { verifyPassword } from '#/auth/session'
import { getDb } from '#/db/client'
import * as schema from '#/db/schema'

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 60

const checkRateLimit = async (ip: string): Promise<boolean> => {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.loginAttemptsTable)
    .where(eq(schema.loginAttemptsTable.ip, ip))

  if (rows.length === 0) return false

  const record = rows[0]
  const windowStart = Date.now() - WINDOW_SECONDS * 1000

  if (record.lastAttempt < windowStart) return false

  return record.attempts >= MAX_ATTEMPTS
}

const recordFailedAttempt = async (ip: string): Promise<void> => {
  const db = getDb()
  const now = Date.now()
  const windowStart = now - WINDOW_SECONDS * 1000

  const rows = await db
    .select()
    .from(schema.loginAttemptsTable)
    .where(eq(schema.loginAttemptsTable.ip, ip))

  if (rows.length === 0) {
    await db.insert(schema.loginAttemptsTable).values({
      ip,
      attempts: 1,
      lastAttempt: now,
    })
    return
  }

  const record = rows[0]

  if (record.lastAttempt < windowStart) {
    await db
      .update(schema.loginAttemptsTable)
      .set({ attempts: 1, lastAttempt: now })
      .where(eq(schema.loginAttemptsTable.ip, ip))
  } else {
    await db
      .update(schema.loginAttemptsTable)
      .set({ attempts: record.attempts + 1, lastAttempt: now })
      .where(eq(schema.loginAttemptsTable.ip, ip))
  }
}

const clearAttempts = async (ip: string): Promise<void> => {
  const db = getDb()
  await db
    .delete(schema.loginAttemptsTable)
    .where(eq(schema.loginAttemptsTable.ip, ip))
}

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'

        const isRateLimited = await checkRateLimit(ip)
        if (isRateLimited) {
          return new Response('Too Many Requests', { status: 429 })
        }

        const formData = await request.formData()
        const password = formData.get('password')

        if (typeof password !== 'string') {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
          })
        }

        if (!verifyPassword(password, env.APP_PASSWORD)) {
          await recordFailedAttempt(ip)
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
          })
        }

        await clearAttempts(ip)
        return loginWithPassword(password)
      },
    },
  },
})
