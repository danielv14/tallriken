import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { getAllRecipes, getRecipeById, getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'
import { recipeInputSchema } from '#/recipes/recipe'
import { createRecipeSearch } from '#/recipes/search'
import { authMiddleware } from '#/auth/middleware'
import { getVectorSearch, getRecipeIndex } from '#/vector/client'
import { createSyncedMutations } from '#/vector/with-vector-sync'

const getMutations = () => createSyncedMutations(getDb(), getRecipeIndex())

export const saveRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => getMutations().createRecipe(data))

export const editRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const { id, ...input } = data
    return getMutations().updateRecipe(id, input)
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await getMutations().deleteRecipe(data.id)
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
