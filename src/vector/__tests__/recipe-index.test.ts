import { describe, it, expect, vi } from 'vitest'
import { createTestDb, createTestTag, createTestRecipe } from '#/test-utils'
import { createRecipeIndex } from '#/vector/recipe-index'
import type { VectorSearch } from '#/vector/search'

vi.mock('#/vector/embed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#/vector/embed')>()
  return {
    ...actual,
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  }
})

const createMockVectorSearch = (): VectorSearch => ({
  findSimilar: vi.fn().mockResolvedValue([]),
  upsert: vi.fn(),
  remove: vi.fn(),
})

describe('RecipeIndex', () => {
  describe('onRecipeSaved', () => {
    it('calls upsert on vector search', async () => {
      const db = createTestDb()
      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      await index.onRecipeSaved(
        {
          id: 1,
          title: 'Pasta Carbonara',
          description: 'Klassisk pasta',
          ingredients: [{ group: null, items: ['pasta', 'ägg'] }],
          cookingTimeMinutes: 25,
        },
        [],
      )

      expect(vectorSearch.upsert).toHaveBeenCalledWith(
        1,
        expect.any(Array),
        expect.objectContaining({ cookingTimeMinutes: 25 }),
      )
    })
  })

  describe('onRecipeDeleted', () => {
    it('calls remove on vector search', async () => {
      const db = createTestDb()
      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      await index.onRecipeDeleted(42)

      expect(vectorSearch.remove).toHaveBeenCalledWith(42)
    })
  })

  describe('onTagRenamed', () => {
    it('re-syncs exactly the affected recipes', async () => {
      const db = createTestDb()
      const tag = await createTestTag(db, 'Italienskt')
      const otherTag = await createTestTag(db, 'Snabblagat')

      const recipe1 = await createTestRecipe(db, {
        title: 'Pasta',
        tagIds: [tag.id],
      })
      const recipe2 = await createTestRecipe(db, {
        title: 'Pizza',
        tagIds: [tag.id],
      })
      // This recipe should NOT be re-synced
      await createTestRecipe(db, {
        title: 'Soppa',
        tagIds: [otherTag.id],
      })

      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      await index.onTagRenamed(tag.id)

      expect(vectorSearch.upsert).toHaveBeenCalledTimes(2)
      const upsertedIds = (vectorSearch.upsert as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: unknown[]) => call[0],
      )
      expect(upsertedIds).toContain(recipe1.id)
      expect(upsertedIds).toContain(recipe2.id)
    })

    it('does nothing when no recipes have the tag', async () => {
      const db = createTestDb()
      const tag = await createTestTag(db, 'Oanvänd')

      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      await index.onTagRenamed(tag.id)

      expect(vectorSearch.upsert).not.toHaveBeenCalled()
    })
  })

  describe('backfillAll', () => {
    it('processes all recipes in batches', async () => {
      const db = createTestDb()
      // Create 3 recipes
      await createTestRecipe(db, { title: 'Recept 1' })
      await createTestRecipe(db, { title: 'Recept 2' })
      await createTestRecipe(db, { title: 'Recept 3' })

      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      const result = await index.backfillAll()

      expect(result).toEqual({ total: 3 })
      expect(vectorSearch.upsert).toHaveBeenCalledTimes(3)
    })

    it('returns zero total when no recipes exist', async () => {
      const db = createTestDb()
      const vectorSearch = createMockVectorSearch()
      const index = createRecipeIndex(db, vectorSearch, 'test-api-key')

      const result = await index.backfillAll()

      expect(result).toEqual({ total: 0 })
      expect(vectorSearch.upsert).not.toHaveBeenCalled()
    })
  })
})
