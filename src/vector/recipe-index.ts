import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import type { VectorSearch } from '#/vector/search'
import { syncRecipeVector, type SyncRecipe } from '#/vector/sync'
import { getAllRecipes, getRecipesByIds } from '#/recipes/crud'

export type RecipeIndex = {
  onRecipeSaved: (recipe: SyncRecipe, tagIds: number[]) => Promise<void>
  onRecipeDeleted: (recipeId: number) => Promise<void>
  onTagRenamed: (tagId: number) => Promise<void>
  backfillAll: () => Promise<{ total: number }>
}

const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const createRecipeIndex = (
  db: Database,
  vectorSearch: VectorSearch,
  apiKey: string,
): RecipeIndex => ({
  onRecipeSaved: async (recipe, tagIds) => {
    await syncRecipeVector(vectorSearch, apiKey, db, recipe, tagIds)
  },

  onRecipeDeleted: async (recipeId) => {
    await vectorSearch.remove(recipeId)
  },

  onTagRenamed: async (tagId) => {
    const recipeTagRows = await db
      .select({ recipeId: schema.recipeTagsTable.recipeId })
      .from(schema.recipeTagsTable)
      .where(eq(schema.recipeTagsTable.tagId, tagId))

    if (recipeTagRows.length === 0) return

    const recipeIds = recipeTagRows.map((r) => r.recipeId)
    const recipes = await getRecipesByIds(db, recipeIds)

    await Promise.all(
      recipes.map((recipe) =>
        syncRecipeVector(vectorSearch, apiKey, db, recipe, recipe.tags.map((t) => t.id)),
      ),
    )
  },

  backfillAll: async () => {
    const recipes = await getAllRecipes(db)

    for (const batch of chunk(recipes, 10)) {
      await Promise.all(
        batch.map((recipe) =>
          syncRecipeVector(vectorSearch, apiKey, db, recipe, recipe.tags.map((t) => t.id)),
        ),
      )
    }

    return { total: recipes.length }
  },
})
