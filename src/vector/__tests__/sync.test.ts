import { describe, it, expect, vi } from 'vitest'
import { createTestDb, createTestTag } from '#/test-utils'
import { syncRecipeVector } from '#/vector/sync'
import type { VectorSearch } from '#/vector/search'

vi.mock('#/vector/embed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#/vector/embed')>()
  return {
    ...actual,
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  }
})

const createMockVectorSearch = (): VectorSearch & { upsertCalls: unknown[][] } => {
  const upsertCalls: unknown[][] = []
  return {
    upsertCalls,
    findSimilar: vi.fn().mockResolvedValue([]),
    upsert: vi.fn(async (...args: unknown[]) => {
      upsertCalls.push(args)
    }),
    remove: vi.fn(),
  }
}

describe('syncRecipeVector', () => {
  it('embeds recipe with tag names and upserts vector', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Italienskt')
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector(vectorSearch, 'test-api-key', db, {
      id: 1,
      title: 'Pasta Carbonara',
      description: 'Klassisk pasta',
      cookingTimeMinutes: 25,
    }, [tag.id])

    expect(vectorSearch.upsert).toHaveBeenCalledWith(
      1,
      expect.any(Array),
      { tagNames: ['Italienskt'], cookingTimeMinutes: 25 },
    )
  })

  it('handles recipe with no tags', async () => {
    const db = createTestDb()
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector(vectorSearch, 'test-api-key', db, {
      id: 2,
      title: 'Enkel soppa',
      description: null,
      cookingTimeMinutes: null,
    }, [])

    expect(vectorSearch.upsert).toHaveBeenCalledWith(
      2,
      expect.any(Array),
      { tagNames: [], cookingTimeMinutes: 0 },
    )
  })

  it('resolves multiple tag names from ids', async () => {
    const db = createTestDb()
    const tag1 = await createTestTag(db, 'Snabblagat')
    const tag2 = await createTestTag(db, 'Barnvänligt')
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector(vectorSearch, 'test-api-key', db, {
      id: 3,
      title: 'Pannkakor',
      description: 'Snabba pannkakor',
      cookingTimeMinutes: 15,
    }, [tag1.id, tag2.id])

    const metadata = vectorSearch.upsertCalls[0][2] as Record<string, unknown>
    expect(metadata.tagNames).toHaveLength(2)
    expect(metadata.tagNames).toContain('Snabblagat')
    expect(metadata.tagNames).toContain('Barnvänligt')
  })
})
