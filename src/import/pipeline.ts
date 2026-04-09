import { getAllTags } from '#/tags/crud'
import { extractJsonLdRecipe, extractImageUrl } from '#/import/extract'
import { extractRecipeWithAi } from '#/import/ai-extract'
import { extractRecipeFromImages } from '#/import/ocr-extract'
import { resolveTagIds } from '#/import/auto-tag'
import { downloadAndStore } from '#/images/image-ops'
import type { RecipeDraft } from '#/import/schema'
import type { Database } from '#/db/types'

export type ImportContext = {
  db: Database
  openaiApiKey: string
}

export type ImportResult = {
  draft: RecipeDraft
  tagIds: number[]
  imageUrl: string | null
  sourceUrl?: string
}

export const importRecipeFromUrl = async (
  url: string,
  context: ImportContext,
): Promise<ImportResult> => {
  const html = await fetchHtml(url)

  const tags = await getAllTags(context.db)
  const tagNames = tags.map((t) => t.name)

  const draft = await extractRecipe(html, tagNames, context.openaiApiKey)
  const tagIds = await resolveTagIds(draft, tags, context.openaiApiKey)

  const originalImageUrl = extractImageUrl(html)
  const imageUrl = originalImageUrl ? await downloadAndStore(originalImageUrl) : null

  return { draft, tagIds, imageUrl, sourceUrl: url }
}

export const importRecipeFromPhotos = async (
  images: Array<{ base64: string; mimeType: string }>,
  context: ImportContext,
): Promise<ImportResult> => {
  const tags = await getAllTags(context.db)
  const tagNames = tags.map((t) => t.name)

  const draft = await extractRecipeFromImages(images, tagNames, context.openaiApiKey)

  if (!draft) {
    throw new Error('Kunde inte extrahera något recept från bilderna')
  }

  const tagIds = await resolveTagIds(draft, tags, context.openaiApiKey)

  return { draft, tagIds, imageUrl: null }
}

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Tallriken/1.0)',
      Accept: 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`Kunde inte hämta sidan (${response.status})`)
  }

  return response.text()
}

const extractRecipe = async (
  html: string,
  tagNames: string[],
  apiKey: string,
): Promise<RecipeDraft> => {
  const jsonLdDraft = extractJsonLdRecipe(html)
  if (jsonLdDraft) return jsonLdDraft

  const aiDraft = await extractRecipeWithAi(html, tagNames, apiKey)
  if (aiDraft) return aiDraft

  throw new Error('Kunde inte extrahera något recept från den angivna sidan')
}

