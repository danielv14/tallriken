import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { getVectorSearch } from '#/vector/client'
import { createRecipeIndex } from '#/vector/recipe-index'
import { authMiddleware } from '#/auth/middleware'

export const triggerBackfill = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const index = createRecipeIndex(db, getVectorSearch(), env.OPENAI_API_KEY)
    return index.backfillAll()
  })
