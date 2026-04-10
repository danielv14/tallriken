import { inArray, sql } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { searchRecipes, getAllRecipes, getRecipesByIds } from '#/recipes/crud'

type RecipeWithTags = Awaited<ReturnType<typeof getAllRecipes>>[number]

export type SearchParams = {
  query?: string
  tags?: string[] | number[]
  maxCookingTimeMinutes?: number
}

export type RecipeSearch = {
  search: (params: SearchParams) => Promise<RecipeWithTags[]>
}

export type FindSimilar = (query: string) => Promise<{ recipeId: number; score: number }[]>

export const createRecipeSearch = (db: Database, findSimilar?: FindSimilar): RecipeSearch => ({
  search: async (params: SearchParams): Promise<RecipeWithTags[]> => {
    const query = params.query?.trim() ?? ''
    const hasQuery = query.length > 0

    const tagIds = await resolveTagsParam(db, params.tags)

    if (findSimilar && hasQuery) {
      try {
        return await vectorSearch(db, findSimilar, query, tagIds, params.maxCookingTimeMinutes)
      } catch (error) {
        console.error('[search] vector search failed, falling back to DB search:', error)
        return fallbackSearch(db, query, tagIds, params.maxCookingTimeMinutes)
      }
    }

    return fallbackSearch(db, query, tagIds, params.maxCookingTimeMinutes)
  },
})

const vectorSearch = async (
  db: Database,
  findSimilar: FindSimilar,
  query: string,
  tagIds: number[],
  maxCookingTimeMinutes?: number,
): Promise<RecipeWithTags[]> => {
  const similar = await findSimilar(query)
  if (similar.length === 0) return []

  const recipeIds = similar.map((s) => s.recipeId)
  const recipes = await getRecipesByIds(db, recipeIds)

  const filtered = recipes.filter((r) => {
    if (maxCookingTimeMinutes) {
      if (r.cookingTimeMinutes == null || r.cookingTimeMinutes > maxCookingTimeMinutes) return false
    }
    if (tagIds.length > 0) {
      const recipeTagIds = r.tags.map((t) => t.id)
      if (!tagIds.some((id) => recipeTagIds.includes(id))) return false
    }
    return true
  })

  // Preserve vector similarity ranking
  const idOrder = new Map(recipeIds.map((id, i) => [id, i]))
  filtered.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

  return filtered
}

const fallbackSearch = async (
  db: Database,
  query: string,
  tagIds: number[],
  maxCookingTimeMinutes?: number,
): Promise<RecipeWithTags[]> => {
  const fuzzyTagIds = query ? await fuzzyMatchTags(db, query) : []
  const allTagIds = [...new Set([...tagIds, ...fuzzyTagIds])]

  const textResults = query
    ? await searchRecipes(db, { query, maxCookingTimeMinutes })
    : []

  const tagResults = allTagIds.length > 0
    ? await searchRecipes(db, { tagIds: allTagIds, maxCookingTimeMinutes })
    : []

  if (!query && allTagIds.length === 0) {
    return searchRecipes(db, { maxCookingTimeMinutes })
  }

  const seen = new Set<number>()
  const merged = [...tagResults, ...textResults].filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  return merged
}

const resolveTagsParam = async (db: Database, tags?: string[] | number[]): Promise<number[]> => {
  if (!tags || tags.length === 0) return []

  // If already numeric IDs, return directly
  if (typeof tags[0] === 'number') return tags as number[]

  return resolveTagNames(db, tags as string[])
}

const resolveTagNames = async (db: Database, tagNames: string[]): Promise<number[]> => {
  const lowerNames = tagNames.map((n) => n.toLowerCase())
  const tags = await db
    .select({ id: schema.tagsTable.id })
    .from(schema.tagsTable)
    .where(inArray(sql`lower(${schema.tagsTable.name})`, lowerNames))

  return tags.map((t) => t.id)
}

const fuzzyMatchTags = async (db: Database, query: string): Promise<number[]> => {
  const allTags = await db
    .select({ id: schema.tagsTable.id, name: schema.tagsTable.name })
    .from(schema.tagsTable)

  const queryWords = query.toLowerCase().split(/\s+/)

  const matchedTags = allTags.filter((tag) => {
    const tagLower = tag.name.toLowerCase()
    return queryWords.some((word) =>
      sharesStem(word, tagLower) ||
      tagLower.includes(word) ||
      word.includes(tagLower),
    )
  })

  return matchedTags.map((t) => t.id)
}

const sharesStem = (a: string, b: string): boolean => {
  const minLen = Math.min(a.length, b.length)
  if (minLen < 4) return false

  let shared = 0
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) shared++
    else break
  }

  // At least 75% of the shorter word must match as prefix
  return shared >= Math.ceil(minLen * 0.75)
}
