import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { importRecipeFromUrl, importRecipeFromPhotos } from '#/import/pipeline'

export const extractRecipeFromUrl = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    const result = await importRecipeFromUrl(data.url, {
      db: getDb(),
      openaiApiKey: env.OPENAI_API_KEY,
    })
    return { ...result.draft, sourceUrl: result.sourceUrl, tagIds: result.tagIds, imageUrl: result.imageUrl }
  })

export const extractRecipeFromPhotos = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      images: z.array(z.object({
        base64: z.string().min(1),
        mimeType: z.string().min(1),
      })).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const result = await importRecipeFromPhotos(data.images, {
      db: getDb(),
      openaiApiKey: env.OPENAI_API_KEY,
    })
    return { ...result.draft, tagIds: result.tagIds }
  })
