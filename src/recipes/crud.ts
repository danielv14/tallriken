import { and, desc, eq, inArray, like, or } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

type IngredientGroup = { group: string | null; items: string[] }

type CreateRecipeInput = {
  title: string
  description?: string
  ingredients: IngredientGroup[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  sourceUrl?: string
  tagIds: number[]
}

type UpdateRecipeInput = {
  title: string
  description?: string
  ingredients: IngredientGroup[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  tagIds: number[]
}

type SearchFilters = {
  query?: string
  tagIds?: number[]
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

export const updateRecipe = async (db: Database, id: number, input: UpdateRecipeInput) => {
  const result = await db
    .update(schema.recipesTable)
    .set({
      title: input.title,
      description: input.description ?? null,
      ingredients: input.ingredients,
      steps: input.steps,
      cookingTimeMinutes: input.cookingTimeMinutes ?? null,
      servings: input.servings ?? null,
    })
    .where(eq(schema.recipesTable.id, id))
    .returning()

  // Replace tag associations
  await db.delete(schema.recipeTagsTable).where(eq(schema.recipeTagsTable.recipeId, id))
  if (input.tagIds.length > 0) {
    await db.insert(schema.recipeTagsTable).values(
      input.tagIds.map((tagId) => ({
        recipeId: id,
        tagId,
      })),
    )
  }

  return result[0]
}

export const deleteRecipe = async (db: Database, id: number) => {
  await db.delete(schema.recipeTagsTable).where(eq(schema.recipeTagsTable.recipeId, id))
  await db.delete(schema.recipesTable).where(eq(schema.recipesTable.id, id))
}

export const getAllRecipes = async (db: Database) => {
  const recipes = await db
    .select()
    .from(schema.recipesTable)
    .orderBy(desc(schema.recipesTable.id))

  return attachTags(db, recipes)
}

export const searchRecipes = async (db: Database, filters: SearchFilters) => {
  const conditions = []

  if (filters.query) {
    const pattern = `%${filters.query}%`
    conditions.push(
      or(
        like(schema.recipesTable.title, pattern),
        like(schema.recipesTable.description, pattern),
        like(schema.recipesTable.ingredients, pattern),
      ),
    )
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const recipeIdsWithTags = db
      .select({ recipeId: schema.recipeTagsTable.recipeId })
      .from(schema.recipeTagsTable)
      .where(inArray(schema.recipeTagsTable.tagId, filters.tagIds))

    conditions.push(inArray(schema.recipesTable.id, recipeIdsWithTags))
  }

  const recipes = await db
    .select()
    .from(schema.recipesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.recipesTable.id))

  return attachTags(db, recipes)
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

// Shared helper to attach tags to a list of recipes
const attachTags = async (db: Database, recipes: (typeof schema.recipesTable.$inferSelect)[]) => {
  if (recipes.length === 0) return []

  const recipeIds = recipes.map((r) => r.id)

  const allRecipeTags = await db
    .select({
      recipeId: schema.recipeTagsTable.recipeId,
      tagId: schema.tagsTable.id,
      tagName: schema.tagsTable.name,
    })
    .from(schema.recipeTagsTable)
    .innerJoin(schema.tagsTable, eq(schema.recipeTagsTable.tagId, schema.tagsTable.id))
    .where(inArray(schema.recipeTagsTable.recipeId, recipeIds))

  const tagsByRecipeId = new Map<number, { id: number; name: string }[]>()
  for (const row of allRecipeTags) {
    const existing = tagsByRecipeId.get(row.recipeId) ?? []
    existing.push({ id: row.tagId, name: row.tagName })
    tagsByRecipeId.set(row.recipeId, existing)
  }

  return recipes.map((recipe) => ({
    ...recipe,
    tags: tagsByRecipeId.get(recipe.id) ?? [],
  }))
}
