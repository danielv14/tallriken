import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { getAllTags } from '#/tags/crud'
import { extractJsonLdRecipe, extractImageUrl } from '#/import/extract'
import { extractRecipeWithAi } from '#/import/ai-extract'
import { extractRecipeFromImages } from '#/import/ocr-extract'
import { resolveTagIds } from '#/import/auto-tag'
import { uploadImageToR2, getImageUrl } from '#/images/r2'
import type { RecipeDraft } from '#/import/schema'

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Tallriken/1.0)',
      'Accept': 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`Kunde inte hämta sidan (${response.status})`)
  }

  return response.text()
}

const extractRecipe = async (html: string, tagNames: string[], apiKey: string): Promise<RecipeDraft> => {
  const jsonLdDraft = extractJsonLdRecipe(html)
  if (jsonLdDraft) return jsonLdDraft

  const aiDraft = await extractRecipeWithAi(html, tagNames, apiKey)
  if (aiDraft) return aiDraft

  throw new Error('Kunde inte extrahera något recept från den angivna sidan')
}

const downloadAndStoreImage = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null

    const contentType = response.headers.get('Content-Type') ?? 'image/jpeg'
    const data = await response.arrayBuffer()

    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const key = `recipes/imported-${Date.now()}.${extension}`
    await uploadImageToR2(key, data, contentType)

    return getImageUrl(key)
  } catch {
    return null
  }
}

export const extractRecipeFromUrl = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    const html = await fetchHtml(data.url)

    const db = getDb()
    const tags = await getAllTags(db)
    const tagNames = tags.map((t) => t.name)

    const draft = await extractRecipe(html, tagNames, env.OPENAI_API_KEY)
    const tagIds = await resolveTagIds(draft, tags, env.OPENAI_API_KEY)

    // Try to extract and store the recipe image
    const originalImageUrl = extractImageUrl(html)
    const imageUrl = originalImageUrl ? await downloadAndStoreImage(originalImageUrl) : null

    return { ...draft, sourceUrl: data.url, tagIds, imageUrl }
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
    const db = getDb()
    const tags = await getAllTags(db)
    const tagNames = tags.map((t) => t.name)

    const draft = await extractRecipeFromImages(data.images, tagNames, env.OPENAI_API_KEY)

    if (!draft) {
      throw new Error('Kunde inte extrahera något recept från bilderna')
    }

    const tagIds = await resolveTagIds(draft, tags, env.OPENAI_API_KEY)

    return { ...draft, tagIds }
  })
