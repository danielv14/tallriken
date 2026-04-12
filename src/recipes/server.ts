import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { inArray } from 'drizzle-orm'
import { getDb } from '#/db/client'
import * as schema from '#/db/schema'
import { createRecipe, getAllRecipes, getRecipeById, updateRecipe, deleteRecipe, getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'
import { recipeInputSchema } from '#/recipes/recipe'
import { createRecipeSearch } from '#/recipes/search'
import { authMiddleware } from '#/auth/middleware'
import { getVectorSearch, getRecipeIndex } from '#/vector/client'
import type { Database } from '#/db/types'

const getTagNamesByIds = async (db: Database, tagIds: number[]): Promise<string[]> => {
  if (tagIds.length === 0) return []
  const tags = await db
    .select({ name: schema.tagsTable.name })
    .from(schema.tagsTable)
    .where(inArray(schema.tagsTable.id, tagIds))
  return tags.map((t) => t.name)
}

export const saveRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => {
    const db = getDb()
    const recipe = await createRecipe(db, data)
    const tagNames = await getTagNamesByIds(db, data.tagIds)
    const index = getRecipeIndex()
    await index.onRecipeSaved(recipe, tagNames)
    return recipe
  })

export const editRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    const { id, ...input } = data
    const recipe = await updateRecipe(db, id, input)
    const tagNames = await getTagNamesByIds(db, input.tagIds)
    const index = getRecipeIndex()
    await index.onRecipeSaved(recipe, tagNames)
    return recipe
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteRecipe(db, data.id)
    const index = getRecipeIndex()
    await index.onRecipeDeleted(data.id)
  })

export const fetchAllRecipes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getAllRecipes(db)
})

export const fetchRecipeById = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    return getRecipeById(db, data.id)
  })

export const findRecipes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      query: z.string().optional(),
      tagIds: z.array(z.number()).optional(),
      maxCookingTimeMinutes: z.number().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb()
    const search = createRecipeSearch(db, (q) => getVectorSearch().findSimilar({ query: q, topK: 20 }))
    return search.search({ query: data.query, tags: data.tagIds, maxCookingTimeMinutes: data.maxCookingTimeMinutes })
  })

export const fetchFavoriteRecipes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getFavoriteRecipes(db, 5)
})

export const fetchStaleRecipes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getStaleRecipes(db, 5)
})
