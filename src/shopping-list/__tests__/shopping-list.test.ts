import { describe, it, expect } from 'vitest'
import { createTestDb } from '#/test-utils'
import { saveShoppingList, getShoppingList } from '#/shopping-list/crud'

describe('shopping list', () => {
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

  it('returns null when no shopping list exists', async () => {
    const db = createTestDb()

    const result = await getShoppingList(db)

    expect(result).toBeNull()
  })
})
