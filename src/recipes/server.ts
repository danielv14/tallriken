import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipe, getAllRecipes, getRecipeById, updateRecipe, deleteRecipe, getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'
import { recipeInputSchema } from '#/recipes/recipe'
import { createRecipeSearch } from '#/recipes/search'
import { authMiddleware } from '#/auth/middleware'
import { getVectorSearch } from '#/vector/client'
import { syncRecipeVector } from '#/vector/sync'
import { env } from 'cloudflare:workers'

export const saveRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => {
    const db = getDb()
    const recipe = await createRecipe(db, data)
    await syncRecipeVector(getVectorSearch(), env.OPENAI_API_KEY, db, recipe, data.tagIds)
    return recipe
  })

export const editRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    const { id, ...input } = data
    const recipe = await updateRecipe(db, id, input)
    await syncRecipeVector(getVectorSearch(), env.OPENAI_API_KEY, db, recipe, input.tagIds)
    return recipe
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteRecipe(db, data.id)
    await getVectorSearch().remove(data.id)
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
