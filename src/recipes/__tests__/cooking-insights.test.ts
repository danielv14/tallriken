import { describe, it, expect } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { getFavoriteRecipes, getStaleRecipes } from '#/recipes/crud'

const setCookingStats = async (
  db: ReturnType<typeof createTestDb>,
  recipeId: number,
  cookCount: number,
  lastCookedAt: Date | null,
) => {
  await db
    .update(schema.recipesTable)
    .set({ cookCount, lastCookedAt })
    .where(eq(schema.recipesTable.id, recipeId))
}

describe('cooking insights', () => {
  it('returns favorite recipes sorted by cook count, excluding uncooked', async () => {
    const db = createTestDb()
    const pasta = await createTestRecipe(db, { title: 'Pasta' })
    const curry = await createTestRecipe(db, { title: 'Curry' })
    const salad = await createTestRecipe(db, { title: 'Salad' })

    await setCookingStats(db, pasta.id, 5, new Date())
    await setCookingStats(db, curry.id, 2, new Date())
    // salad has cookCount=0 (default)

    const favorites = await getFavoriteRecipes(db, 5)

    expect(favorites).toHaveLength(2)
    expect(favorites[0].title).toBe('Pasta')
    expect(favorites[1].title).toBe('Curry')
  })

  it('returns stale recipes sorted by oldest last cooked', async () => {
    const db = createTestDb()
    const pasta = await createTestRecipe(db, { title: 'Pasta' })
    const curry = await createTestRecipe(db, { title: 'Curry' })
    const salad = await createTestRecipe(db, { title: 'Salad' })

    const longAgo = new Date('2024-01-01')
    const recent = new Date('2025-04-01')

    await setCookingStats(db, pasta.id, 1, longAgo)
    await setCookingStats(db, curry.id, 1, recent)
    // salad never cooked - should not appear

    const stale = await getStaleRecipes(db, 5)

    expect(stale).toHaveLength(2)
    expect(stale[0].title).toBe('Pasta')
    expect(stale[1].title).toBe('Curry')
  })
})
