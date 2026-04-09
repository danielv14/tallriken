import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipe, getAllRecipes, getRecipeById, updateRecipe, deleteRecipe, searchRecipes, getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'

const ingredientGroupSchema = z.object({
  group: z.string().nullable(),
  items: z.array(z.string().min(1)).min(1),
})

const recipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(ingredientGroupSchema).min(1),
  steps: z.array(z.string().min(1)).optional(),
  cookingTimeMinutes: z.number().positive().optional(),
  servings: z.number().positive().optional(),
  tagIds: z.array(z.number()),
  sourceUrl: z.string().optional(),
  imageUrl: z.string().optional(),
})

export const saveRecipe = createServerFn({ method: 'POST' })
  .inputValidator(recipeInputSchema)
  .handler(async ({ data }) => {
    const db = getDb()
    return createRecipe(db, data)
  })

export const editRecipe = createServerFn({ method: 'POST' })
  .inputValidator(recipeInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    const { id, ...input } = data
    return updateRecipe(db, id, input)
  })

export const removeRecipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteRecipe(db, data.id)
  })

export const fetchAllRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getAllRecipes(db)
})

export const fetchRecipeById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    return getRecipeById(db, data.id)
  })

export const findRecipes = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      query: z.string().optional(),
      tagIds: z.array(z.number()).optional(),
      maxCookingTimeMinutes: z.number().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb()
    return searchRecipes(db, data)
  })

export const fetchFavoriteRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getFavoriteRecipes(db, 5)
})

export const fetchStaleRecipes = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getStaleRecipes(db, 5)
})
