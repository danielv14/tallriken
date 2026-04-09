import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

export type MenuItem = {
  id: number
  addedAt: Date
  completedAt: Date | null
  recipe: {
    id: number
    title: string
    description: string | null
    cookingTimeMinutes: number | null
    servings: number | null
    imageUrl: string | null
    ingredients: { group: string | null; items: string[] }[]
  }
}

export const addToMenu = async (db: Database, recipeId: number) => {
  const existing = await db
    .select({ id: schema.weeklyMenuItemsTable.id })
    .from(schema.weeklyMenuItemsTable)
    .where(eq(schema.weeklyMenuItemsTable.recipeId, recipeId))

  if (existing.length > 0) return

  await db.insert(schema.weeklyMenuItemsTable).values({ recipeId })
}

export const removeFromMenu = async (db: Database, recipeId: number) => {
  await db
    .delete(schema.weeklyMenuItemsTable)
    .where(eq(schema.weeklyMenuItemsTable.recipeId, recipeId))
}

export const clearMenu = async (db: Database) => {
  await db.delete(schema.weeklyMenuItemsTable)
}

export const getMenuRecipeIds = async (db: Database): Promise<number[]> => {
  const rows = await db
    .select({ recipeId: schema.weeklyMenuItemsTable.recipeId })
    .from(schema.weeklyMenuItemsTable)

  return rows.map((r) => r.recipeId)
}

export const toggleComplete = async (
  db: Database,
  recipeId: number,
): Promise<{ recipeId: number; completed: boolean } | undefined> => {
  const items = await db
    .select({
      id: schema.weeklyMenuItemsTable.id,
      completedAt: schema.weeklyMenuItemsTable.completedAt,
    })
    .from(schema.weeklyMenuItemsTable)
    .where(eq(schema.weeklyMenuItemsTable.recipeId, recipeId))

  if (items.length === 0) return undefined

  const item = items[0]
  const completed = !item.completedAt

  if (completed) {
    await db
      .update(schema.weeklyMenuItemsTable)
      .set({ completedAt: new Date() })
      .where(eq(schema.weeklyMenuItemsTable.id, item.id))
  } else {
    await db
      .update(schema.weeklyMenuItemsTable)
      .set({ completedAt: null })
      .where(eq(schema.weeklyMenuItemsTable.id, item.id))
  }

  return { recipeId, completed }
}

export const getMenu = async (db: Database): Promise<MenuItem[]> => {
  const rows = await db
    .select({
      menuId: schema.weeklyMenuItemsTable.id,
      addedAt: schema.weeklyMenuItemsTable.addedAt,
      completedAt: schema.weeklyMenuItemsTable.completedAt,
      recipeId: schema.recipesTable.id,
      title: schema.recipesTable.title,
      description: schema.recipesTable.description,
      cookingTimeMinutes: schema.recipesTable.cookingTimeMinutes,
      servings: schema.recipesTable.servings,
      imageUrl: schema.recipesTable.imageUrl,
      ingredients: schema.recipesTable.ingredients,
    })
    .from(schema.weeklyMenuItemsTable)
    .innerJoin(
      schema.recipesTable,
      eq(schema.weeklyMenuItemsTable.recipeId, schema.recipesTable.id),
    )
    .orderBy(schema.weeklyMenuItemsTable.addedAt)

  return rows.map((row) => ({
    id: row.menuId,
    addedAt: row.addedAt,
    completedAt: row.completedAt,
    recipe: {
      id: row.recipeId,
      title: row.title,
      description: row.description,
      cookingTimeMinutes: row.cookingTimeMinutes,
      servings: row.servings,
      imageUrl: row.imageUrl,
      ingredients: row.ingredients,
    },
  }))
}
