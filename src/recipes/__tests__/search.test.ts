import { describe, it, expect, vi } from 'vitest'
import { createTestDb, createTestRecipe, createTestTag } from '#/test-utils'
import { createRecipeSearch, type FindSimilar } from '#/recipes/search'

describe('recipe search', () => {
  it('finds recipes matching query in title', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Chicken Curry' })

    const search = createRecipeSearch(db)
    const results = await search.search({ query: 'pasta' })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })

  it('returns all recipes when query is empty', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Chicken Curry' })

    const search = createRecipeSearch(db)
    const results = await search.search({})

    expect(results).toHaveLength(2)
  })

  it('filters by tag names (string[])', async () => {
    const db = createTestDb()
    const italian = await createTestTag(db, 'Italian')
    const thai = await createTestTag(db, 'Thai')
    await createTestRecipe(db, { title: 'Pasta Carbonara', tagIds: [italian.id] })
    await createTestRecipe(db, { title: 'Pad Thai', tagIds: [thai.id] })

    const search = createRecipeSearch(db)
    const results = await search.search({ tags: ['Thai'] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pad Thai')
  })

  it('filters by tag IDs (number[])', async () => {
    const db = createTestDb()
    const italian = await createTestTag(db, 'Italian')
    const thai = await createTestTag(db, 'Thai')
    await createTestRecipe(db, { title: 'Pasta Carbonara', tagIds: [italian.id] })
    await createTestRecipe(db, { title: 'Pad Thai', tagIds: [thai.id] })

    const search = createRecipeSearch(db)
    const results = await search.search({ tags: [thai.id] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pad Thai')
  })

  it('filters by max cooking time', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Quick Salad', cookingTimeMinutes: 10 })
    await createTestRecipe(db, { title: 'Slow Roast', cookingTimeMinutes: 180 })

    const search = createRecipeSearch(db)
    const results = await search.search({ maxCookingTimeMinutes: 30 })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Quick Salad')
  })

  it('includes cooking stats in results', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })

    const search = createRecipeSearch(db)
    const results = await search.search({ query: 'pasta' })

    expect(results[0].cookCount).toBe(0)
    expect(results[0].lastCookedAt).toBeNull()
  })

  it('finds recipes by fuzzy tag match (different word forms)', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Barnvänligt')
    await createTestRecipe(db, { title: 'Ugnspannkaka', tagIds: [tag.id] })
    await createTestRecipe(db, { title: 'Pad Thai' })

    const search = createRecipeSearch(db)
    const results = await search.search({ query: 'barnvänliga' })

    expect(results.map((r) => r.title)).toContain('Ugnspannkaka')
    expect(results.map((r) => r.title)).not.toContain('Pad Thai')
  })
})

describe('recipe search with vector search', () => {
  it('uses findSimilar when provided and query is non-empty', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Kycklinggryta' })

    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: recipe.id, score: 0.92 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'krämig kyckling' })

    expect(findSimilar).toHaveBeenCalledWith('krämig kyckling')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Kycklinggryta')
  })

  it('falls back to text search when query is empty', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Pad Thai' })

    const findSimilar: FindSimilar = vi.fn()

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({})

    expect(findSimilar).not.toHaveBeenCalled()
    expect(results).toHaveLength(2)
  })

  it('preserves vector similarity ranking', async () => {
    const db = createTestDb()
    const first = await createTestRecipe(db, { title: 'Snabb pasta' })
    const second = await createTestRecipe(db, { title: 'Långsam gryta' })

    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: second.id, score: 0.95 },
      { recipeId: first.id, score: 0.80 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'gryta' })

    expect(results[0].title).toBe('Långsam gryta')
    expect(results[1].title).toBe('Snabb pasta')
  })

  it('applies tag filter on vector results', async () => {
    const db = createTestDb()
    const italian = await createTestTag(db, 'Italienskt')
    const thai = await createTestTag(db, 'Thai')
    const pasta = await createTestRecipe(db, { title: 'Pasta', tagIds: [italian.id] })
    const padThai = await createTestRecipe(db, { title: 'Pad Thai', tagIds: [thai.id] })

    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: pasta.id, score: 0.9 },
      { recipeId: padThai.id, score: 0.8 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'nudlar', tags: ['Italienskt'] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta')
  })

  it('applies max cooking time filter on vector results', async () => {
    const db = createTestDb()
    const quick = await createTestRecipe(db, { title: 'Snabbsallad', cookingTimeMinutes: 10 })
    const slow = await createTestRecipe(db, { title: 'Brässerad bog', cookingTimeMinutes: 240 })

    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: quick.id, score: 0.9 },
      { recipeId: slow.id, score: 0.8 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'mat', maxCookingTimeMinutes: 30 })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Snabbsallad')
  })

  it('falls back to DB search when vector search returns empty', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })

    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'pasta' })

    expect(findSimilar).toHaveBeenCalled()
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })

  it('finds recipe by title even when not in vector index', async () => {
    const db = createTestDb()
    const indexed = await createTestRecipe(db, { title: 'Tom Yum Soppa' })
    await createTestRecipe(db, { title: 'Majscarbonara' })

    // Vector only knows about Tom Yum, not Majscarbonara
    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: indexed.id, score: 0.5 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'majscarbonara' })

    const titles = results.map((r) => r.title)
    expect(titles).toContain('Majscarbonara')
  })

  it('merges vector and DB results without duplicates', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta Carbonara' })

    // Vector returns the same recipe DB search would find
    const findSimilar: FindSimilar = vi.fn().mockResolvedValue([
      { recipeId: recipe.id, score: 0.9 },
    ])

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'pasta' })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })

  it('falls back to DB search when vector search throws', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })

    const findSimilar: FindSimilar = vi.fn().mockRejectedValue(new Error('Vector service down'))

    const search = createRecipeSearch(db, findSimilar)
    const results = await search.search({ query: 'pasta' })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })
})
