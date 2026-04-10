import { inArray, sql } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { searchRecipes, getAllRecipes, getRecipesByIds } from '#/recipes/crud'

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

export type FindSimilar = (query: string) => Promise<{ recipeId: number; score: number }[]>

export const createRecipeSearch = (db: Database, findSimilar?: FindSimilar) => ({
  search: async (query: string, filters?: SearchFilters): Promise<CompactRecipeResult[]> => {
    if (findSimilar && query) {
      return vectorSearch(db, findSimilar, query, filters)
    }

    return fallbackSearch(db, query, filters)
  },
})

const vectorSearch = async (
  db: Database,
  findSimilar: FindSimilar,
  query: string,
  filters?: SearchFilters,
): Promise<CompactRecipeResult[]> => {
  const similar = await findSimilar(query)
  if (similar.length === 0) return []

  const recipeIds = similar.map((s) => s.recipeId)
  const recipes = await getRecipesByIds(db, recipeIds)

  const explicitTagIds = await resolveTagNames(db, filters?.tags)

  const filtered = recipes.filter((r) => {
    if (filters?.maxCookingTimeMinutes && r.cookingTimeMinutes != null) {
      if (r.cookingTimeMinutes > filters.maxCookingTimeMinutes) return false
    }
    if (explicitTagIds.length > 0) {
      const recipeTagIds = r.tags.map((t) => t.id)
      if (!explicitTagIds.some((id) => recipeTagIds.includes(id))) return false
    }
    return true
  })

  // Preserve vector similarity ranking
  const idOrder = new Map(recipeIds.map((id, i) => [id, i]))
  filtered.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

  return filtered.map(formatResult)
}

const fallbackSearch = async (
  db: Database,
  query: string,
  filters?: SearchFilters,
): Promise<CompactRecipeResult[]> => {
  const explicitTagIds = await resolveTagNames(db, filters?.tags)
  const fuzzyTagIds = query ? await fuzzyMatchTags(db, query) : []
  const allTagIds = [...new Set([...explicitTagIds, ...fuzzyTagIds])]

  const textResults = query
    ? await searchRecipes(db, {
        query,
        maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
      })
    : []

  const tagResults = allTagIds.length > 0
    ? await searchRecipes(db, {
        tagIds: allTagIds,
        maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
      })
    : []

  if (!query && allTagIds.length === 0) {
    const all = await searchRecipes(db, {
      maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
    })
    return all.map(formatResult)
  }

  const seen = new Set<number>()
  const merged = [...tagResults, ...textResults].filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  return merged.map(formatResult)
}

const formatResult = (r: Awaited<ReturnType<typeof getAllRecipes>>[number]): CompactRecipeResult => ({
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
})

const resolveTagNames = async (db: Database, tagNames?: string[]): Promise<number[]> => {
  if (!tagNames || tagNames.length === 0) return []

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
      // "barnvänliga" matches "barnvänligt" (shared prefix of 10+ chars)
      sharesStem(word, tagLower) ||
      // exact substring match
      tagLower.includes(word) ||
      word.includes(tagLower)
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
