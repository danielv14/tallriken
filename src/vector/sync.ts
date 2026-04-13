import type { VectorSearch } from '#/vector/search'
import { buildEmbeddingText, embed } from '#/vector/embed'

export type SyncRecipe = {
  id: number
  title: string
  description: string | null
  ingredients: { group: string | null; items: string[] }[]
  cookingTimeMinutes: number | null
}

type SyncRecipeVectorOptions = {
  vectorSearch: VectorSearch
  apiKey: string
  recipe: SyncRecipe
  tagNames: string[]
}

export const syncRecipeVector = async (options: SyncRecipeVectorOptions): Promise<void> => {
  const { vectorSearch, apiKey, recipe, tagNames } = options

  const text = buildEmbeddingText({
    title: recipe.title,
    tags: tagNames,
    description: recipe.description,
    ingredients: recipe.ingredients.flatMap((g) => g.items),
    cookingTimeMinutes: recipe.cookingTimeMinutes,
  })

  const vector = await embed(text, apiKey)

  await vectorSearch.upsert(recipe.id, vector)
}
