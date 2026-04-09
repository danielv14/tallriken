import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

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

export const getMenu = async (db: Database) => {
  const rows = await db
    .select({
      menuId: schema.weeklyMenuItemsTable.id,
      addedAt: schema.weeklyMenuItemsTable.addedAt,
      recipeId: schema.recipesTable.id,
      title: schema.recipesTable.title,
      description: schema.recipesTable.description,
      cookingTimeMinutes: schema.recipesTable.cookingTimeMinutes,
      servings: schema.recipesTable.servings,
      imageUrl: schema.recipesTable.imageUrl,
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
    recipe: {
      id: row.recipeId,
      title: row.title,
      description: row.description,
      cookingTimeMinutes: row.cookingTimeMinutes,
      servings: row.servings,
      imageUrl: row.imageUrl,
    },
  }))
}
