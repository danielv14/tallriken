import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import {
  generateImageForRecipe,
  uploadImageForRecipe as uploadImageForRecipeOp,
  generateImagePreview,
  uploadImagePreview,
} from '#/images'
import { authMiddleware } from '#/auth/middleware'

export const generateAndSaveImage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    return generateImageForRecipe(getDb(), data.recipeId, env.OPENAI_API_KEY)
  })

export const generateImageFromDetails = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    return generateImagePreview(data.title, data.description ?? null, env.OPENAI_API_KEY)
  })

export const uploadRecipeImage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    return uploadImagePreview(data.base64, data.mimeType)
  })

export const uploadImageForRecipe = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({
    recipeId: z.number(),
    base64: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    return uploadImageForRecipeOp(getDb(), data.recipeId, data.base64, data.mimeType)
  })
