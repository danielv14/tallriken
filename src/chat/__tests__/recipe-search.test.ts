import { describe, it, expect } from 'vitest'
import { createTestDb, createTestRecipe, createTestTag } from '#/test-utils'
import { createRecipeSearch } from '#/chat/recipe-search'

describe('recipe search', () => {
  it('finds recipes matching query in title', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Chicken Curry' })

    const search = createRecipeSearch(db)
    const results = await search.search('pasta')

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })

  it('returns all recipes when query is empty', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Chicken Curry' })

    const search = createRecipeSearch(db)
    const results = await search.search('')

    expect(results).toHaveLength(2)
  })

  it('formats results with flattened ingredients, string tags, and URL', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Italian')
    await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      description: 'Classic Roman dish',
      ingredients: [
        { group: 'Pasta', items: ['spaghetti', 'eggs'] },
        { group: null, items: ['parmesan'] },
      ],
      cookingTimeMinutes: 30,
      servings: 4,
      tagIds: [tag.id],
    })

    const search = createRecipeSearch(db)
    const results = await search.search('pasta')

    expect(results[0]).toEqual({
      id: expect.any(Number),
      title: 'Pasta Carbonara',
      description: 'Classic Roman dish',
      ingredients: ['[Pasta]', 'spaghetti', 'eggs', 'parmesan'],
      cookingTimeMinutes: 30,
      servings: 4,
      tags: ['Italian'],
      cookCount: 0,
      lastCookedAt: null,
      url: `/recipes/${results[0].id}`,
    })
  })

  it('filters by tag names', async () => {
    const db = createTestDb()
    const italian = await createTestTag(db, 'Italian')
    const thai = await createTestTag(db, 'Thai')
    await createTestRecipe(db, { title: 'Pasta Carbonara', tagIds: [italian.id] })
    await createTestRecipe(db, { title: 'Pad Thai', tagIds: [thai.id] })

    const search = createRecipeSearch(db)
    const results = await search.search('', { tags: ['Thai'] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pad Thai')
  })

  it('filters by max cooking time', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Quick Salad', cookingTimeMinutes: 10 })
    await createTestRecipe(db, { title: 'Slow Roast', cookingTimeMinutes: 180 })

    const search = createRecipeSearch(db)
    const results = await search.search('', { maxCookingTimeMinutes: 30 })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Quick Salad')
  })

  it('includes cooking stats in results', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })

    const search = createRecipeSearch(db)
    const results = await search.search('pasta')

    expect(results[0].cookCount).toBe(0)
    expect(results[0].lastCookedAt).toBeNull()
  })

  it('finds recipes by fuzzy tag match (different word forms)', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Barnvänligt')
    await createTestRecipe(db, { title: 'Ugnspannkaka', tagIds: [tag.id] })
    await createTestRecipe(db, { title: 'Pad Thai' })

    const search = createRecipeSearch(db)
    const results = await search.search('barnvänliga')

    expect(results.map((r) => r.title)).toContain('Ugnspannkaka')
    expect(results.map((r) => r.title)).not.toContain('Pad Thai')
  })
})
