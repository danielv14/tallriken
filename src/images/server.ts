import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import * as schema from '#/db/schema'
import { uploadImageToR2, getImageUrl, deleteImageFromR2 } from '#/images/r2'
import { generateRecipeImage } from '#/images/generate'

export const generateAndSaveImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()

    const recipes = await db
      .select()
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, data.recipeId))

    if (recipes.length === 0) {
      throw new Error('Receptet hittades inte')
    }

    const recipe = recipes[0]

    // Delete old image if exists
    if (recipe.imageUrl) {
      const oldKey = recipe.imageUrl.replace('/api/images/', '')
      try {
        await deleteImageFromR2(oldKey)
      } catch {
        // Ignore deletion errors
      }
    }

    const imageData = await generateRecipeImage(
      recipe.title,
      recipe.description,
      env.OPENAI_API_KEY,
    )

    const key = `recipes/${data.recipeId}-${Date.now()}.png`
    await uploadImageToR2(key, imageData, 'image/png')

    const imageUrl = getImageUrl(key)
    await db
      .update(schema.recipesTable)
      .set({ imageUrl })
      .where(eq(schema.recipesTable.id, data.recipeId))

    return { imageUrl }
  })
