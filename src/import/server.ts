import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { getAllTags } from '#/tags/crud'
import { extractJsonLdRecipe } from '#/import/extract'
import { extractRecipeWithAi } from '#/import/ai-extract'
import { resolveTagIds } from '#/import/auto-tag'
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
  // Strategy 1: JSON-LD (free, accurate)
  const jsonLdDraft = extractJsonLdRecipe(html)
  if (jsonLdDraft) return jsonLdDraft

  // Strategy 2: AI extraction (GPT-4o)
  const aiDraft = await extractRecipeWithAi(html, tagNames, apiKey)
  if (aiDraft) return aiDraft

  throw new Error('Kunde inte extrahera något recept från den angivna sidan')
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

    return { ...draft, sourceUrl: data.url, tagIds }
  })
