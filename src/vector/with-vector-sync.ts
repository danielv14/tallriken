import { createRecipe, deleteRecipe, updateRecipe } from '#/recipes/crud'
import { getTagNamesByIds, renameTag } from '#/tags/crud'
import type { Database } from '#/db/types'
import type { RecipeInput } from '#/recipes/recipe'
import type { RecipeIndex } from '#/vector/recipe-index'

export const createSyncedMutations = (db: Database, index: RecipeIndex) => ({
  createRecipe: async (input: RecipeInput) => {
    const recipe = await createRecipe(db, input)
    const tagNames = await getTagNamesByIds(db, input.tagIds)
    await index.onRecipeSaved(recipe, tagNames)
    return recipe
  },

  updateRecipe: async (id: number, input: RecipeInput) => {
    const recipe = await updateRecipe(db, id, input)
    const tagNames = await getTagNamesByIds(db, input.tagIds)
    await index.onRecipeSaved(recipe, tagNames)
    return recipe
  },

  deleteRecipe: async (id: number) => {
    await deleteRecipe(db, id)
    await index.onRecipeDeleted(id)
  },

  renameTag: async (id: number, newName: string) => {
    const tag = await renameTag(db, id, newName)
    await index.onTagRenamed(id)
    return tag
  },
})
