import { desc, eq, sql } from 'drizzle-orm'
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

export const getMenuRecipeIds = async (db: Database): Promise<number[]> => {
  const rows = await db
    .select({ recipeId: schema.weeklyMenuItemsTable.recipeId })
    .from(schema.weeklyMenuItemsTable)

  return rows.map((r) => r.recipeId)
}

export const toggleComplete = async (db: Database, recipeId: number) => {
  const items = await db
    .select({
      id: schema.weeklyMenuItemsTable.id,
      completedAt: schema.weeklyMenuItemsTable.completedAt,
    })
    .from(schema.weeklyMenuItemsTable)
    .where(eq(schema.weeklyMenuItemsTable.recipeId, recipeId))

  if (items.length === 0) return

  const item = items[0]
  const isCompleting = !item.completedAt

  if (isCompleting) {
    await db
      .update(schema.weeklyMenuItemsTable)
      .set({ completedAt: new Date() })
      .where(eq(schema.weeklyMenuItemsTable.id, item.id))

    await db
      .update(schema.recipesTable)
      .set({
        cookCount: sql`${schema.recipesTable.cookCount} + 1`,
        lastCookedAt: new Date(),
      })
      .where(eq(schema.recipesTable.id, recipeId))
  } else {
    await db
      .update(schema.weeklyMenuItemsTable)
      .set({ completedAt: null })
      .where(eq(schema.weeklyMenuItemsTable.id, item.id))

    await db
      .update(schema.recipesTable)
      .set({
        cookCount: sql`MAX(${schema.recipesTable.cookCount} - 1, 0)`,
      })
      .where(eq(schema.recipesTable.id, recipeId))
  }
}

export const getMenu = async (db: Database) => {
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

export const saveShoppingList = async (db: Database, content: string) => {
  await db.delete(schema.shoppingListsTable)
  await db.insert(schema.shoppingListsTable).values({ content })
}

export const getShoppingList = async (db: Database): Promise<string | null> => {
  const rows = await db
    .select({ content: schema.shoppingListsTable.content })
    .from(schema.shoppingListsTable)
    .orderBy(desc(schema.shoppingListsTable.id))
    .limit(1)

  return rows.length > 0 ? rows[0].content : null
}
