import { eq, sql } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

export const recordCooked = async (db: Database, recipeId: number) => {
  await db
    .update(schema.recipesTable)
    .set({
      cookCount: sql`${schema.recipesTable.cookCount} + 1`,
      lastCookedAt: new Date(),
    })
    .where(eq(schema.recipesTable.id, recipeId))
}

export const undoCooked = async (db: Database, recipeId: number) => {
  await db
    .update(schema.recipesTable)
    .set({
      cookCount: sql`MAX(${schema.recipesTable.cookCount} - 1, 0)`,
      lastCookedAt: sql`CASE WHEN ${schema.recipesTable.cookCount} <= 1 THEN NULL ELSE ${schema.recipesTable.lastCookedAt} END`,
    })
    .where(eq(schema.recipesTable.id, recipeId))
}
