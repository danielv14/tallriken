import { describe, it, expect } from 'vitest'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { recordCooked, undoCooked } from '#/recipes/cooking-stats'
import { getRecipeById } from '#/recipes/crud'

describe('cooking stats', () => {
  it('increments cook count and sets lastCookedAt', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await recordCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(1)
    expect(updated!.lastCookedAt).toBeInstanceOf(Date)
  })

  it('increments cook count multiple times', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await recordCooked(db, recipe.id)
    await recordCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(2)
  })

  it('decrements cook count', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await recordCooked(db, recipe.id)
    await undoCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(0)
  })

  it('does not decrement cook count below zero', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await undoCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(0)
  })

  it('preserves lastCookedAt when cookCount stays above zero', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await recordCooked(db, recipe.id)
    await recordCooked(db, recipe.id)
    const afterCook = await getRecipeById(db, recipe.id)
    const lastCookedAt = afterCook!.lastCookedAt

    await undoCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(1)
    expect(updated!.lastCookedAt).toEqual(lastCookedAt)
  })

  it('clears lastCookedAt when cookCount reaches zero', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await recordCooked(db, recipe.id)
    await undoCooked(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(0)
    expect(updated!.lastCookedAt).toBeNull()
  })
})
