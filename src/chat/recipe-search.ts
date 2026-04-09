import { inArray } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { searchRecipes } from '#/recipes/crud'

export type CompactRecipeResult = {
  id: number
  title: string
  description: string | null
  ingredients: string[]
  cookingTimeMinutes: number | null
  servings: number | null
  tags: string[]
  cookCount: number
  lastCookedAt: Date | null
  url: string
}

type SearchFilters = {
  tags?: string[]
  maxCookingTimeMinutes?: number
}

export const createRecipeSearch = (db: Database) => ({
  search: async (query: string, filters?: SearchFilters): Promise<CompactRecipeResult[]> => {
    const tagIds = await resolveTagNames(db, filters?.tags)

    const recipes = await searchRecipes(db, {
      query: query || undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
    })

    return recipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      ingredients: r.ingredients.flatMap((g) =>
        g.group ? [`[${g.group}]`, ...g.items] : g.items,
      ),
      cookingTimeMinutes: r.cookingTimeMinutes,
      servings: r.servings,
      tags: r.tags.map((t) => t.name),
      cookCount: r.cookCount,
      lastCookedAt: r.lastCookedAt,
      url: `/recipes/${r.id}`,
    }))
  },
})

const resolveTagNames = async (db: Database, tagNames?: string[]): Promise<number[]> => {
  if (!tagNames || tagNames.length === 0) return []

  const tags = await db
    .select({ id: schema.tagsTable.id })
    .from(schema.tagsTable)
    .where(inArray(schema.tagsTable.name, tagNames))

  return tags.map((t) => t.id)
}
