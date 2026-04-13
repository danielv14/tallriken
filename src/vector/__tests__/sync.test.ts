import { describe, it, expect, vi } from 'vitest'
import { syncRecipeVector } from '#/vector/sync'
import type { VectorSearch } from '#/vector/search'

vi.mock('#/vector/embed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#/vector/embed')>()
  return {
    ...actual,
    embed: vi.fn().mockResolvedValue(Array.from({ length: 1536 }, () => 0.1)),
  }
})

const createMockVectorSearch = (): VectorSearch => ({
  findSimilar: vi.fn().mockResolvedValue([]),
  upsert: vi.fn(),
  remove: vi.fn(),
})

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
    )
  })

  it('upserts vector for recipe with multiple tags', async () => {
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

    expect(vectorSearch.upsert).toHaveBeenCalledWith(
      3,
      expect.any(Array),
    )
  })
})
