import { createServerFn } from '@tanstack/react-start'
import { getRecipeIndex } from '#/vector/client'
import { authMiddleware } from '#/auth/middleware'

export const triggerBackfill = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const index = getRecipeIndex()
    return index.backfillAll()
  })
