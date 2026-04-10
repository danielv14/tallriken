import { getAllRecipes } from '#/recipes/crud'
import type { Database } from '#/db/types'
import type { VectorSearch } from '#/vector/search'
import { syncRecipeVector } from '#/vector/sync'

const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const backfillAllRecipes = async (
  db: Database,
  vectorSearch: VectorSearch,
  apiKey: string,
): Promise<{ total: number }> => {
  const recipes = await getAllRecipes(db)

  for (const batch of chunk(recipes, 10)) {
    await Promise.all(
      batch.map((recipe) =>
        syncRecipeVector(vectorSearch, apiKey, db, recipe, recipe.tags.map((t) => t.id)),
      ),
    )
  }

  return { total: recipes.length }
}
