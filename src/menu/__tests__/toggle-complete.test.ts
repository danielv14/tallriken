import { describe, it, expect } from 'vitest'
import { createTestDb, createTestRecipe } from '#/test-utils'
import { addToMenu, getMenu } from '#/menu/crud'
import { toggleRecipeComplete } from '#/menu/toggle-complete'
import * as schema from '#/db/schema'
import { eq } from 'drizzle-orm'

describe('toggleRecipeComplete', () => {
  it('marks a menu item as complete and records cook stats', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })
    await addToMenu(db, recipe.id)

    await toggleRecipeComplete(db, recipe.id)

    const menu = await getMenu(db)
    expect(menu[0].completedAt).not.toBeNull()

    const [updated] = await db
      .select({ cookCount: schema.recipesTable.cookCount })
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, recipe.id))
    expect(updated.cookCount).toBe(1)
  })

  it('uncompletes a menu item and undoes cook stats', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })
    await addToMenu(db, recipe.id)

    // Complete then uncomplete
    await toggleRecipeComplete(db, recipe.id)
    await toggleRecipeComplete(db, recipe.id)

    const menu = await getMenu(db)
    expect(menu[0].completedAt).toBeNull()

    const [updated] = await db
      .select({ cookCount: schema.recipesTable.cookCount })
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, recipe.id))
    expect(updated.cookCount).toBe(0)
  })

  it('does nothing when recipe is not in menu', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    // Should not throw
    await toggleRecipeComplete(db, recipe.id)

    const [unchanged] = await db
      .select({ cookCount: schema.recipesTable.cookCount })
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, recipe.id))
    expect(unchanged.cookCount).toBe(0)
  })
})
