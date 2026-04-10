import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipe, getAllRecipes, getRecipeById, getRecipesByIds, updateRecipe, deleteRecipe, searchRecipes, getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'
import { recipeInputSchema } from '#/recipes/recipe'
import { authMiddleware } from '#/auth/middleware'
import { getVectorSearch } from '#/vector/client'
import { createRecipeIndex } from '#/vector/recipe-index'
import { env } from 'cloudflare:workers'

export const saveRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => {
    const db = getDb()
    const recipe = await createRecipe(db, data)
    const index = createRecipeIndex(db, getVectorSearch(), env.OPENAI_API_KEY)
    await index.onRecipeSaved(recipe, data.tagIds)
    return recipe
  })

export const editRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    const { id, ...input } = data
    const recipe = await updateRecipe(db, id, input)
    const index = createRecipeIndex(db, getVectorSearch(), env.OPENAI_API_KEY)
    await index.onRecipeSaved(recipe, input.tagIds)
    return recipe
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteRecipe(db, data.id)
    const index = createRecipeIndex(db, getVectorSearch(), env.OPENAI_API_KEY)
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
    const hasQuery = data.query && data.query.trim().length > 0
    const hasTagFilter = data.tagIds && data.tagIds.length > 0

    // Vector search for freetext queries without tag filters
    if (hasQuery && !hasTagFilter) {
      const vectorSearch = getVectorSearch()
      const similar = await vectorSearch.findSimilar({ query: data.query!, topK: 20 })

      if (similar.length > 0) {
        const recipeIds = similar.map((s) => s.recipeId)
        const recipes = await getRecipesByIds(db, recipeIds)

        const filtered = data.maxCookingTimeMinutes
          ? recipes.filter((r) => r.cookingTimeMinutes != null && r.cookingTimeMinutes <= data.maxCookingTimeMinutes!)
          : recipes

        // Preserve vector similarity ranking
        const idOrder = new Map(recipeIds.map((id, i) => [id, i]))
        filtered.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

        return filtered
      }
    }

    // D1 search for tag-only, filter-only, or empty queries
    return searchRecipes(db, data)
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
