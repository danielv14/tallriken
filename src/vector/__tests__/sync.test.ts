import { describe, it, expect, vi } from 'vitest'
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
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector({
      vectorSearch,
      apiKey: 'test-api-key',
      recipe: {
        id: 1,
        title: 'Pasta Carbonara',
        description: 'Klassisk pasta',
        ingredients: [{ group: null, items: ['pasta', 'ägg'] }],
        cookingTimeMinutes: 25,
      },
      tagNames: ['Italienskt'],
    })

    expect(vectorSearch.upsert).toHaveBeenCalledWith(
      1,
      expect.any(Array),
      { tagNames: ['Italienskt'], cookingTimeMinutes: 25 },
    )
  })

  it('handles recipe with no tags', async () => {
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector({
      vectorSearch,
      apiKey: 'test-api-key',
      recipe: {
        id: 2,
        title: 'Enkel soppa',
        description: null,
        ingredients: [],
        cookingTimeMinutes: null,
      },
      tagNames: [],
    })

    expect(vectorSearch.upsert).toHaveBeenCalledWith(
      2,
      expect.any(Array),
      { tagNames: [], cookingTimeMinutes: 0 },
    )
  })

  it('passes multiple tag names through to metadata', async () => {
    const vectorSearch = createMockVectorSearch()

    await syncRecipeVector({
      vectorSearch,
      apiKey: 'test-api-key',
      recipe: {
        id: 3,
        title: 'Pannkakor',
        description: 'Snabba pannkakor',
        ingredients: [{ group: null, items: ['mjöl', 'ägg', 'mjölk'] }],
        cookingTimeMinutes: 15,
      },
      tagNames: ['Snabblagat', 'Barnvänligt'],
    })

    const metadata = vectorSearch.upsertCalls[0][2] as Record<string, unknown>
    expect(metadata.tagNames).toHaveLength(2)
    expect(metadata.tagNames).toContain('Snabblagat')
    expect(metadata.tagNames).toContain('Barnvänligt')
  })
})
