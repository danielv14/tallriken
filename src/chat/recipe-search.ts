import { inArray, sql } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { searchRecipes, getAllRecipes } from '#/recipes/crud'

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
    // Step 1: Resolve explicit tag filters
    const explicitTagIds = await resolveTagNames(db, filters?.tags)

    // Step 2: Fuzzy-match query against tag names
    const fuzzyTagIds = query ? await fuzzyMatchTags(db, query) : []

    // Step 3: Merge tag IDs
    const allTagIds = [...new Set([...explicitTagIds, ...fuzzyTagIds])]

    // Step 4: Search with two strategies and merge results
    // Strategy A: text search (query against title/description/ingredients)
    const textResults = query
      ? await searchRecipes(db, {
          query,
          maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
        })
      : []

    // Strategy B: tag search (fuzzy-matched tags)
    const tagResults = allTagIds.length > 0
      ? await searchRecipes(db, {
          tagIds: allTagIds,
          maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
        })
      : []

    // If no query and no tags, return all
    if (!query && allTagIds.length === 0) {
      const all = await searchRecipes(db, {
        maxCookingTimeMinutes: filters?.maxCookingTimeMinutes,
      })
      return all.map(formatResult)
    }

    // Merge and deduplicate
    const seen = new Set<number>()
    const merged = [...tagResults, ...textResults].filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    return merged.map(formatResult)
  },
})

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
