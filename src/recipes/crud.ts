import { eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '#/db/schema'

type Database = BetterSQLite3Database<typeof schema> | DrizzleD1Database<typeof schema>

type CreateRecipeInput = {
  title: string
  description?: string
  ingredients: string[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  sourceUrl?: string
  tagIds: number[]
}

export const createRecipe = async (db: Database, input: CreateRecipeInput) => {
  const result = await db
    .insert(schema.recipesTable)
    .values({
      title: input.title,
      description: input.description ?? null,
      ingredients: input.ingredients,
      steps: input.steps,
      cookingTimeMinutes: input.cookingTimeMinutes ?? null,
      servings: input.servings ?? null,
      sourceUrl: input.sourceUrl ?? null,
      createdAt: new Date(),
    })
    .returning()

  const recipe = result[0]

  if (input.tagIds.length > 0) {
    await db.insert(schema.recipeTagsTable).values(
      input.tagIds.map((tagId) => ({
        recipeId: recipe.id,
        tagId,
      })),
    )
  }

  return recipe
}

export const getRecipeById = async (db: Database, id: number) => {
  const recipes = await db
    .select()
    .from(schema.recipesTable)
    .where(eq(schema.recipesTable.id, id))

  if (recipes.length === 0) return null

  const recipe = recipes[0]

  const tagRows = await db
    .select({ name: schema.tagsTable.name, id: schema.tagsTable.id })
    .from(schema.recipeTagsTable)
    .innerJoin(schema.tagsTable, eq(schema.recipeTagsTable.tagId, schema.tagsTable.id))
    .where(eq(schema.recipeTagsTable.recipeId, id))

  return { ...recipe, tags: tagRows }
}
