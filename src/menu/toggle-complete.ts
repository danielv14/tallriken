import type { Database } from '#/db/types'
import { toggleComplete } from '#/menu/crud'
import { recordCooked, undoCooked } from '#/recipes/cooking-stats'

export const toggleRecipeComplete = async (db: Database, recipeId: number): Promise<void> => {
  const result = await toggleComplete(db, recipeId)

  if (result) {
    if (result.completed) {
      await recordCooked(db, result.recipeId)
    } else {
      await undoCooked(db, result.recipeId)
    }
  }
}
