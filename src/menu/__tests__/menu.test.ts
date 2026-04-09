import { describe, it, expect } from 'vitest'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { addToMenu, getMenu, removeFromMenu, clearMenu, toggleComplete, saveShoppingList, getShoppingList } from '#/menu/crud'
import { getRecipeById } from '#/recipes/crud'

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

  it('marks a recipe as cooked and updates cooking stats', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })
    await addToMenu(db, recipe.id)

    await toggleComplete(db, recipe.id)

    const menu = await getMenu(db)
    expect(menu[0].completedAt).toBeInstanceOf(Date)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(1)
    expect(updated!.lastCookedAt).toBeInstanceOf(Date)
  })

  it('unmarks a cooked recipe and decrements cook count', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })
    await addToMenu(db, recipe.id)

    await toggleComplete(db, recipe.id)
    await toggleComplete(db, recipe.id)

    const menu = await getMenu(db)
    expect(menu[0].completedAt).toBeNull()

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(0)
  })

  it('saves and retrieves a shopping list', async () => {
    const db = createTestDb()
    const content = '## Mejeri\n- 3 dl grädde\n- 2 dl mjölk'

    await saveShoppingList(db, content)
    const result = await getShoppingList(db)

    expect(result).toBe(content)
  })

  it('replaces previous shopping list on save', async () => {
    const db = createTestDb()

    await saveShoppingList(db, 'old list')
    await saveShoppingList(db, 'new list')
    const result = await getShoppingList(db)

    expect(result).toBe('new list')
  })

  it('does not decrement cook count below zero', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })
    await addToMenu(db, recipe.id)

    // Complete then uncomplete twice
    await toggleComplete(db, recipe.id)
    await toggleComplete(db, recipe.id)
    await toggleComplete(db, recipe.id)
    await toggleComplete(db, recipe.id)

    const updated = await getRecipeById(db, recipe.id)
    expect(updated!.cookCount).toBe(0)
  })
})
