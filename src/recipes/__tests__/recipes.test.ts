import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '#/db/schema'
import { createRecipe, getRecipeById } from '#/recipes/crud'
import { createTag } from '#/tags/crud'

const createTestDb = () => {
  const sqlite = new Database(':memory:')
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

describe('createRecipe', () => {
  it('creates a recipe and returns it with an id', async () => {
    const db = createTestDb()

    const recipe = await createRecipe(db, {
      title: 'Pasta Carbonara',
      ingredients: ['400g spaghetti', '200g pancetta', '4 äggulor', '100g parmesan'],
      steps: ['Koka pasta', 'Stek pancetta', 'Blanda ägg och ost', 'Vänd ihop'],
      cookingTimeMinutes: 25,
      servings: 4,
      tagIds: [],
    })

    expect(recipe.id).toBeTruthy()
    expect(recipe.title).toBe('Pasta Carbonara')
  })

  it('creates recipe with tag associations', async () => {
    const db = createTestDb()
    const tag1 = await createTag(db, 'Snabblagat')
    const tag2 = await createTag(db, 'Italienskt')

    const recipe = await createRecipe(db, {
      title: 'Pasta Carbonara',
      ingredients: ['400g spaghetti'],
      tagIds: [tag1.id, tag2.id],
    })

    const fetched = await getRecipeById(db, recipe.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.tags.map((t) => t.name).sort()).toEqual(['Italienskt', 'Snabblagat'])
  })
})

describe('getRecipeById', () => {
  it('returns the recipe with its tags and parsed arrays', async () => {
    const db = createTestDb()
    const tag = await createTag(db, 'Barnvänligt')

    const recipe = await createRecipe(db, {
      title: 'Köttfärssås',
      description: 'Klassisk köttfärssås',
      ingredients: ['500g köttfärs', '1 burk krossade tomater'],
      steps: ['Stek köttfärs', 'Häll i tomater', 'Låt sjuda'],
      cookingTimeMinutes: 45,
      servings: 6,
      tagIds: [tag.id],
    })

    const fetched = await getRecipeById(db, recipe.id)

    expect(fetched).not.toBeNull()
    expect(fetched!.title).toBe('Köttfärssås')
    expect(fetched!.description).toBe('Klassisk köttfärssås')
    expect(fetched!.ingredients).toEqual(['500g köttfärs', '1 burk krossade tomater'])
    expect(fetched!.steps).toEqual(['Stek köttfärs', 'Häll i tomater', 'Låt sjuda'])
    expect(fetched!.cookingTimeMinutes).toBe(45)
    expect(fetched!.servings).toBe(6)
    expect(fetched!.tags).toHaveLength(1)
    expect(fetched!.tags[0].name).toBe('Barnvänligt')
  })

  it('returns null for a non-existent recipe', async () => {
    const db = createTestDb()

    const fetched = await getRecipeById(db, 999)

    expect(fetched).toBeNull()
  })
})
