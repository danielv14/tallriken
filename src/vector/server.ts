import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { getVectorSearch } from '#/vector/client'
import { backfillAllRecipes } from '#/vector/backfill'
import { authMiddleware } from '#/auth/middleware'

export const triggerBackfill = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const vectorSearch = getVectorSearch()
    const result = await backfillAllRecipes(db, vectorSearch, env.OPENAI_API_KEY)
    return result
  })
