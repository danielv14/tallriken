import { inArray } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import type { VectorSearch } from '#/vector/search'
import { buildEmbeddingText, embed } from '#/vector/embed'

type SyncRecipe = {
  id: number
  title: string
  description: string | null
  ingredients: { group: string | null; items: string[] }[]
  cookingTimeMinutes: number | null
}

export const syncRecipeVector = async (
  vectorSearch: VectorSearch,
  apiKey: string,
  db: Database,
  recipe: SyncRecipe,
  tagIds: number[],
): Promise<void> => {
  const tagNames = tagIds.length > 0
    ? (await db
        .select({ name: schema.tagsTable.name })
        .from(schema.tagsTable)
        .where(inArray(schema.tagsTable.id, tagIds))
      ).map((t) => t.name)
    : []

  const text = buildEmbeddingText({
    title: recipe.title,
    tags: tagNames,
    description: recipe.description,
    ingredients: recipe.ingredients.flatMap((g) => g.items),
    cookingTimeMinutes: recipe.cookingTimeMinutes,
  })

  const vector = await embed(text, apiKey)

  await vectorSearch.upsert(recipe.id, vector, {
    tagNames,
    cookingTimeMinutes: recipe.cookingTimeMinutes ?? 0,
  })
}
