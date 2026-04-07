import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { getAllTags } from '#/tags/crud'
import { extractJsonLdRecipe } from '#/import/extract'
import { extractRecipeWithAi } from '#/import/ai-extract'
import type { RecipeDraft } from '#/import/schema'

export const extractRecipeFromUrl = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }): Promise<RecipeDraft & { sourceUrl: string; tagIds: number[] }> => {
    const response = await fetch(data.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Tallriken/1.0)',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      throw new Error(`Kunde inte hämta sidan (${response.status})`)
    }

    const html = await response.text()
    const db = getDb()
    const tags = await getAllTags(db)
    const tagNames = tags.map((t) => t.name)

    // Försök JSON-LD först (gratis och exakt)
    let draft = extractJsonLdRecipe(html)

    // Fallback till AI-extraktion
    if (!draft) {
      draft = await extractRecipeWithAi(html, tagNames, env.OPENAI_API_KEY)
    }

    if (!draft) {
      throw new Error('Kunde inte extrahera något recept från den angivna sidan')
    }

    // Matcha föreslagna taggnamn mot befintliga taggar
    const tagIds = (draft.suggestedTagNames ?? [])
      .map((name) => tags.find((t) => t.name.toLowerCase() === name.toLowerCase()))
      .filter((t): t is NonNullable<typeof t> => t !== undefined)
      .map((t) => t.id)

    // Om JSON-LD hittades men inga taggar föreslagits, låt AI:n tagga
    if (draft.suggestedTagNames === undefined && tagNames.length > 0) {
      try {
        const aiDraft = await extractRecipeWithAi(
          `<title>${draft.title}</title><p>${draft.description ?? ''}</p><ul>${draft.ingredients.map((i) => `<li>${i}</li>`).join('')}</ul>`,
          tagNames,
          env.OPENAI_API_KEY,
        )
        if (aiDraft?.suggestedTagNames) {
          const aiTagIds = aiDraft.suggestedTagNames
            .map((name) => tags.find((t) => t.name.toLowerCase() === name.toLowerCase()))
            .filter((t): t is NonNullable<typeof t> => t !== undefined)
            .map((t) => t.id)
          return { ...draft, sourceUrl: data.url, tagIds: aiTagIds }
        }
      } catch {
        // AI-taggning misslyckades, fortsätt utan taggar
      }
    }

    return { ...draft, sourceUrl: data.url, tagIds }
  })
