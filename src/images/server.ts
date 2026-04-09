import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { generateAndStore, generatePreview, uploadAndStore, uploadForRecipe } from '#/images/image-ops'

export const generateAndSaveImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    return generateAndStore(getDb(), data.recipeId, env.OPENAI_API_KEY)
  })

export const generateImageFromDetails = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    return generatePreview(data.title, data.description ?? null, env.OPENAI_API_KEY)
  })

export const uploadRecipeImage = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    return uploadAndStore(data.base64, data.mimeType)
  })

export const uploadImageForRecipe = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    recipeId: z.number(),
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    return uploadForRecipe(getDb(), data.recipeId, data.base64, data.mimeType)
  })
