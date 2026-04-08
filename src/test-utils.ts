import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '#/db/schema'
import { createTag } from '#/tags/crud'
import { createRecipe } from '#/recipes/crud'

export const createTestDb = () => {
  const sqlite = new BetterSqlite3(':memory:')
  sqlite.exec(`
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL,
      steps TEXT,
      cooking_time_minutes INTEGER,
      servings INTEGER,
      source_url TEXT,
      image_url TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE recipe_tags (
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE
    );
  `)
  return drizzle(sqlite, { schema })
}

export const createTestTag = async (db: ReturnType<typeof createTestDb>, name: string) => {
  return createTag(db, name)
}

export const createTestRecipe = async (
  db: ReturnType<typeof createTestDb>,
  overrides: Partial<{
    title: string
    description: string
    ingredients: string[]
    steps: string[]
    cookingTimeMinutes: number
    servings: number
    tagIds: number[]
  }> = {},
) => {
  return createRecipe(db, {
    title: overrides.title ?? 'Testrecept',
    ingredients: overrides.ingredients ?? ['testingrediens'],
    description: overrides.description,
    steps: overrides.steps,
    cookingTimeMinutes: overrides.cookingTimeMinutes,
    servings: overrides.servings,
    tagIds: overrides.tagIds ?? [],
  })
}
