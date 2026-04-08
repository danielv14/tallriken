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

export const generateImageFromDetails = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const imageData = await generateRecipeImage(
      data.title,
      data.description ?? null,
      env.OPENAI_API_KEY,
    )

    const key = `recipes/preview-${Date.now()}.png`
    await uploadImageToR2(key, imageData, 'image/png')

    return { imageUrl: getImageUrl(key) }
  })

export const uploadRecipeImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const binaryString = atob(data.base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const extension = data.mimeType.includes('png') ? 'png' : 'jpg'
    const key = `recipes/uploaded-${Date.now()}.${extension}`
    await uploadImageToR2(key, bytes.buffer, data.mimeType)

    return { imageUrl: getImageUrl(key) }
  })

export const uploadImageForRecipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    recipeId: z.number(),
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const binaryString = atob(data.base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const extension = data.mimeType.includes('png') ? 'png' : 'jpg'
    const key = `recipes/${data.recipeId}-uploaded-${Date.now()}.${extension}`
    await uploadImageToR2(key, bytes.buffer, data.mimeType)

    const imageUrl = getImageUrl(key)
    const db = getDb()
    await db
      .update(schema.recipesTable)
      .set({ imageUrl })
      .where(eq(schema.recipesTable.id, data.recipeId))

    return { imageUrl }
  })
