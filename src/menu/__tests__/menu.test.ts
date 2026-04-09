import { describe, it, expect } from 'vitest'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { addToMenu, getMenu, removeFromMenu, clearMenu } from '#/menu/crud'

describe('weekly menu', () => {
  it('adds a recipe to the menu', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta Carbonara' })

    await addToMenu(db, recipe.id)
    const menu = await getMenu(db)

    expect(menu).toHaveLength(1)
    expect(menu[0].recipe.title).toBe('Pasta Carbonara')
  })

  it('prevents adding the same recipe twice', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta Carbonara' })

    await addToMenu(db, recipe.id)
    await addToMenu(db, recipe.id)
    const menu = await getMenu(db)

    expect(menu).toHaveLength(1)
  })

  it('removes a recipe from the menu', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta Carbonara' })

    await addToMenu(db, recipe.id)
    await removeFromMenu(db, recipe.id)
    const menu = await getMenu(db)

    expect(menu).toHaveLength(0)
  })

  it('returns recipe details with menu items', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      cookingTimeMinutes: 30,
      servings: 4,
    })

    await addToMenu(db, recipe.id)
    const menu = await getMenu(db)

    expect(menu[0]).toMatchObject({
      id: expect.any(Number),
      addedAt: expect.any(Date),
      recipe: {
        id: recipe.id,
        title: 'Pasta Carbonara',
        cookingTimeMinutes: 30,
        servings: 4,
      },
    })
  })

  it('clears the entire menu', async () => {
    const db = createTestDb()
    const recipe1 = await createTestRecipe(db, { title: 'Pasta' })
    const recipe2 = await createTestRecipe(db, { title: 'Curry' })

    await addToMenu(db, recipe1.id)
    await addToMenu(db, recipe2.id)
    await clearMenu(db)
    const menu = await getMenu(db)

    expect(menu).toHaveLength(0)
  })

  it('throws when adding a non-existent recipe', async () => {
    const db = createTestDb()

    await expect(addToMenu(db, 9999)).rejects.toThrow()
  })
})
