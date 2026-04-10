import { describe, it, expect, vi } from 'vitest'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { addToMenu } from '#/menu/crud'
import { generateAndSaveShoppingList } from '#/shopping-list/generate-and-save'
import { getShoppingList } from '#/shopping-list/crud'

vi.mock('#/shopping-list/generate', () => ({
  generateShoppingList: vi.fn().mockResolvedValue('## Mejeri\n- 2 dl grädde\n- 1 st parmesan'),
}))

describe('generateAndSaveShoppingList', () => {
  it('generates a shopping list from menu recipes and saves it', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      ingredients: [{ group: null, items: ['grädde', 'parmesan'] }],
    })
    await addToMenu(db, recipe.id)

    const content = await generateAndSaveShoppingList(db, 'fake-api-key')

    expect(content).toContain('Mejeri')
    const saved = await getShoppingList(db)
    expect(saved).toBe(content)
  })

  it('throws when menu is empty', async () => {
    const db = createTestDb()

    await expect(generateAndSaveShoppingList(db, 'fake-api-key')).rejects.toThrow(
      'Inga recept i menyn',
    )
  })
})
