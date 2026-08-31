import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
  getRecipeById,
  getFavoriteRecipes,
  getStaleRecipes,
} from '#/recipes/crud'
import { recipeInputSchema } from '#/recipes/recipe'
import { createRecipeSearch } from '#/recipes/search'
import { authMiddleware } from '#/auth/middleware'

export const saveRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => createRecipe(getDb(), data))

export const editRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const { id, ...input } = data
    return updateRecipe(getDb(), id, input)
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await deleteRecipe(getDb(), data.id)
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
    const search = createRecipeSearch(db)
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
