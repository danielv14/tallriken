import { describe, it, expect, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, createTestTag, createTestRecipe } from '#/test-utils'
import { createSyncedMutations } from '#/vector/with-vector-sync'
import type { RecipeIndex } from '#/vector/recipe-index'
import * as schema from '#/db/schema'

const createMockIndex = (): RecipeIndex => ({
  onRecipeSaved: vi.fn().mockResolvedValue(undefined),
  onRecipeDeleted: vi.fn().mockResolvedValue(undefined),
  onTagRenamed: vi.fn().mockResolvedValue(undefined),
  backfillAll: vi.fn().mockResolvedValue({ total: 0 }),
})

describe('createSyncedMutations', () => {
  describe('createRecipe', () => {
    it('persists the recipe and syncs vector with resolved tag names', async () => {
      const db = createTestDb()
      const italianTag = await createTestTag(db, 'Italienskt')
      const quickTag = await createTestTag(db, 'Snabblagat')
      const index = createMockIndex()
      const mutations = createSyncedMutations(db, index)

      const recipe = await mutations.createRecipe({
        title: 'Pasta Carbonara',
        ingredients: [{ group: null, items: ['pasta', 'ägg'] }],
        tagIds: [italianTag.id, quickTag.id],
      })

      const persisted = await db
        .select()
        .from(schema.recipesTable)
        .where(eq(schema.recipesTable.id, recipe.id))
      expect(persisted).toHaveLength(1)
      expect(persisted[0].title).toBe('Pasta Carbonara')

      expect(index.onRecipeSaved).toHaveBeenCalledTimes(1)
      expect(index.onRecipeSaved).toHaveBeenCalledWith(
        expect.objectContaining({ id: recipe.id, title: 'Pasta Carbonara' }),
        expect.arrayContaining(['Italienskt', 'Snabblagat']),
      )
    })

    it('syncs with empty tag names when recipe has no tags', async () => {
      const db = createTestDb()
      const index = createMockIndex()
      const mutations = createSyncedMutations(db, index)

      const recipe = await mutations.createRecipe({
        title: 'Taggfri',
        ingredients: [{ group: null, items: ['vatten'] }],
        tagIds: [],
      })

      expect(index.onRecipeSaved).toHaveBeenCalledWith(
        expect.objectContaining({ id: recipe.id }),
        [],
      )
    })
  })

  describe('updateRecipe', () => {
    it('persists changes and syncs vector with updated tag names', async () => {
      const db = createTestDb()
      const oldTag = await createTestTag(db, 'Gammal')
      const newTag = await createTestTag(db, 'Ny')
      const existing = await createTestRecipe(db, {
        title: 'Gammalt namn',
        tagIds: [oldTag.id],
      })

      const index = createMockIndex()
      const mutations = createSyncedMutations(db, index)

      const updated = await mutations.updateRecipe(existing.id, {
        title: 'Nytt namn',
        ingredients: [{ group: null, items: ['ingrediens'] }],
        tagIds: [newTag.id],
      })

      const persisted = await db
        .select()
        .from(schema.recipesTable)
        .where(eq(schema.recipesTable.id, existing.id))
      expect(persisted[0].title).toBe('Nytt namn')

      expect(index.onRecipeSaved).toHaveBeenCalledTimes(1)
      expect(index.onRecipeSaved).toHaveBeenCalledWith(
        expect.objectContaining({ id: updated.id, title: 'Nytt namn' }),
        ['Ny'],
      )
    })
  })

  describe('deleteRecipe', () => {
    it('removes the recipe and notifies the vector index', async () => {
      const db = createTestDb()
      const recipe = await createTestRecipe(db, { title: 'Ska raderas' })
      const index = createMockIndex()
      const mutations = createSyncedMutations(db, index)

      await mutations.deleteRecipe(recipe.id)

      const remaining = await db
        .select()
        .from(schema.recipesTable)
        .where(eq(schema.recipesTable.id, recipe.id))
      expect(remaining).toHaveLength(0)

      expect(index.onRecipeDeleted).toHaveBeenCalledWith(recipe.id)
    })
  })

  describe('renameTag', () => {
    it('updates the tag name and notifies the vector index', async () => {
      const db = createTestDb()
      const tag = await createTestTag(db, 'Gammal')
      const index = createMockIndex()
      const mutations = createSyncedMutations(db, index)

      const renamed = await mutations.renameTag(tag.id, 'Ny')

      expect(renamed.name).toBe('Ny')
      const persisted = await db
        .select()
        .from(schema.tagsTable)
        .where(eq(schema.tagsTable.id, tag.id))
      expect(persisted[0].name).toBe('Ny')

      expect(index.onTagRenamed).toHaveBeenCalledWith(tag.id)
    })
  })
})
