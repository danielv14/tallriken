import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { createTag, getAllTags, renameTag, deleteTag } from '#/tags/crud'
import { authMiddleware } from '#/auth/middleware'
import * as schema from '#/db/schema'
import { getVectorSearch } from '#/vector/client'
import { syncRecipeVector } from '#/vector/sync'
import { getRecipesByIds } from '#/recipes/crud'

export const fetchAllTags = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getAllTags(db)
})

export const addTag = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    return createTag(db, data.name)
  })

export const updateTagName = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number(), name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    const tag = await renameTag(db, data.id, data.name)

    const recipeTagRows = await db
      .select({ recipeId: schema.recipeTagsTable.recipeId })
      .from(schema.recipeTagsTable)
      .where(eq(schema.recipeTagsTable.tagId, data.id))

    if (recipeTagRows.length > 0) {
      const vectorSearch = getVectorSearch()
      const recipeIds = recipeTagRows.map((r) => r.recipeId)
      const recipes = await getRecipesByIds(db, recipeIds)

      await Promise.all(
        recipes.map((recipe) =>
          syncRecipeVector(vectorSearch, env.OPENAI_API_KEY, db, recipe, recipe.tags.map((t) => t.id)),
        ),
      )
    }

    return tag
  })

export const removeTag = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteTag(db, data.id)
  })
