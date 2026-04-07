import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipe } from '#/recipes/crud'

export const saveRecipe = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      ingredients: z.array(z.string().min(1)).min(1),
      steps: z.array(z.string().min(1)).optional(),
      cookingTimeMinutes: z.number().positive().optional(),
      servings: z.number().positive().optional(),
      tagIds: z.array(z.number()),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb()
    return createRecipe(db, data)
  })
