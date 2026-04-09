import { resolve } from 'path'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '#/db/schema'
import { createTag } from '#/tags/crud'
import { createRecipe } from '#/recipes/crud'

type IngredientGroup = { group: string | null; items: string[] }

export const createTestDb = () => {
  const sqlite = new BetterSqlite3(':memory:')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') })
  return db
}

export const createTestTag = async (db: ReturnType<typeof createTestDb>, name: string) => {
  return createTag(db, name)
}

export const createTestRecipe = async (
  db: ReturnType<typeof createTestDb>,
  overrides: Partial<{
    title: string
    description: string
    ingredients: IngredientGroup[]
    steps: string[]
    cookingTimeMinutes: number
    servings: number
    tagIds: number[]
  }> = {},
) => {
  return createRecipe(db, {
    title: overrides.title ?? 'Testrecept',
    ingredients: overrides.ingredients ?? [{ group: null, items: ['testingrediens'] }],
    description: overrides.description,
    steps: overrides.steps,
    cookingTimeMinutes: overrides.cookingTimeMinutes,
    servings: overrides.servings,
    tagIds: overrides.tagIds ?? [],
  })
}
