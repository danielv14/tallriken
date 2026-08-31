import { inArray, sql } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { searchRecipes, getAllRecipes } from '#/recipes/crud'

type RecipeWithTags = Awaited<ReturnType<typeof getAllRecipes>>[number]

export type SearchParams = {
  query?: string
  tags?: string[] | number[]
  maxCookingTimeMinutes?: number
}

export type RecipeSearch = {
  search: (params: SearchParams) => Promise<RecipeWithTags[]>
}

export const createRecipeSearch = (db: Database): RecipeSearch => ({
  search: async (params: SearchParams): Promise<RecipeWithTags[]> => {
    const query = params.query?.trim() ?? ''
    const tagIds = await resolveTagsParam(db, params.tags)

    const fuzzyTagIds = query ? await fuzzyMatchTags(db, query) : []
    const allTagIds = [...new Set([...tagIds, ...fuzzyTagIds])]

    if (!query && allTagIds.length === 0) {
      return searchRecipes(db, { maxCookingTimeMinutes: params.maxCookingTimeMinutes })
    }

    const textResults = query
      ? await searchRecipes(db, { query, maxCookingTimeMinutes: params.maxCookingTimeMinutes })
      : []

    const tagResults = allTagIds.length > 0
      ? await searchRecipes(db, { tagIds: allTagIds, maxCookingTimeMinutes: params.maxCookingTimeMinutes })
      : []

    const seen = new Set<number>()
    return [...tagResults, ...textResults].filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
  },
})

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
