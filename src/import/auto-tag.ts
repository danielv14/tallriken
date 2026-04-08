import { extractRecipeWithAi } from '#/import/ai-extract'
import type { RecipeDraft } from '#/import/schema'

type Tag = { id: number; name: string }

const matchTagNames = (suggestedNames: string[], tags: Tag[]): number[] => {
  return suggestedNames
    .map((name) => tags.find((t) => t.name.toLowerCase() === name.toLowerCase()))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map((t) => t.id)
}

export const resolveTagIds = async (
  draft: RecipeDraft,
  tags: Tag[],
  apiKey: string,
): Promise<number[]> => {
  // If AI already suggested tags, match them
  if (draft.suggestedTagNames && draft.suggestedTagNames.length > 0) {
    return matchTagNames(draft.suggestedTagNames, tags)
  }

  // No tags suggested (e.g. JSON-LD extraction) -- ask AI to tag based on recipe content
  if (tags.length === 0) return []

  try {
    const tagNames = tags.map((t) => t.name)
    const allItems = draft.ingredients.flatMap((g) => g.items)
    const summaryHtml = `<title>${draft.title}</title><p>${draft.description ?? ''}</p><ul>${allItems.map((i) => `<li>${i}</li>`).join('')}</ul>`
    const aiDraft = await extractRecipeWithAi(summaryHtml, tagNames, apiKey)

    if (aiDraft?.suggestedTagNames) {
      return matchTagNames(aiDraft.suggestedTagNames, tags)
    }
  } catch {
    // AI tagging failed, continue without tags
  }

  return []
}
