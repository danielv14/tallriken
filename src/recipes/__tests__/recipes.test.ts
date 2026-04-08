import { describe, it, expect } from 'vitest'
import { createTestDb, createTestTag, createTestRecipe } from '#/test-utils'
import { createRecipe, getRecipeById, getAllRecipes, updateRecipe, deleteRecipe, searchRecipes } from '#/recipes/crud'

describe('createRecipe', () => {
  it('creates a recipe and returns it with an id', async () => {
    const db = createTestDb()

    const recipe = await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      ingredients: ['400g spaghetti', '200g pancetta', '4 äggulor', '100g parmesan'],
      steps: ['Koka pasta', 'Stek pancetta', 'Blanda ägg och ost', 'Vänd ihop'],
      cookingTimeMinutes: 25,
      servings: 4,
    })

    expect(recipe.id).toBeTruthy()
    expect(recipe.title).toBe('Pasta Carbonara')
  })

  it('creates recipe with tag associations', async () => {
    const db = createTestDb()
    const tag1 = await createTestTag(db, 'Snabblagat')
    const tag2 = await createTestTag(db, 'Italienskt')

    const recipe = await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      ingredients: ['400g spaghetti'],
      tagIds: [tag1.id, tag2.id],
    })

    const fetched = await getRecipeById(db, recipe.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.tags.map((t) => t.name).sort()).toEqual(['Italienskt', 'Snabblagat'])
  })
})

describe('getRecipeById', () => {
  it('returns the recipe with its tags and parsed arrays', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Barnvänligt')

    const recipe = await createTestRecipe(db, {
      title: 'Köttfärssås',
      description: 'Klassisk köttfärssås',
      ingredients: ['500g köttfärs', '1 burk krossade tomater'],
      steps: ['Stek köttfärs', 'Häll i tomater', 'Låt sjuda'],
      cookingTimeMinutes: 45,
      servings: 6,
      tagIds: [tag.id],
    })

    const fetched = await getRecipeById(db, recipe.id)

    expect(fetched).not.toBeNull()
    expect(fetched!.title).toBe('Köttfärssås')
    expect(fetched!.description).toBe('Klassisk köttfärssås')
    expect(fetched!.ingredients).toEqual(['500g köttfärs', '1 burk krossade tomater'])
    expect(fetched!.steps).toEqual(['Stek köttfärs', 'Häll i tomater', 'Låt sjuda'])
    expect(fetched!.cookingTimeMinutes).toBe(45)
    expect(fetched!.servings).toBe(6)
    expect(fetched!.tags).toHaveLength(1)
    expect(fetched!.tags[0].name).toBe('Barnvänligt')
  })

  it('returns null for a non-existent recipe', async () => {
    const db = createTestDb()

    const fetched = await getRecipeById(db, 999)

    expect(fetched).toBeNull()
  })
})

describe('getAllRecipes', () => {
  it('returns recipes sorted by newest first, with tags', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Snabblagat')

    await createTestRecipe(db, { title: 'Äldre recept' })
    await createTestRecipe(db, { title: 'Nyare recept', tagIds: [tag.id] })

    const recipes = await getAllRecipes(db)

    expect(recipes).toHaveLength(2)
    expect(recipes[0].title).toBe('Nyare recept')
    expect(recipes[0].tags).toHaveLength(1)
    expect(recipes[0].tags[0].name).toBe('Snabblagat')
    expect(recipes[1].title).toBe('Äldre recept')
    expect(recipes[1].tags).toHaveLength(0)
  })

  it('returns empty array when no recipes exist', async () => {
    const db = createTestDb()

    const recipes = await getAllRecipes(db)

    expect(recipes).toEqual([])
  })
})

describe('updateRecipe', () => {
  it('updates recipe fields and returns the updated recipe', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    const updated = await updateRecipe(db, recipe.id, {
      title: 'Pasta Carbonara',
      ingredients: ['400g spaghetti', '200g pancetta'],
      steps: ['Koka', 'Stek', 'Blanda'],
      cookingTimeMinutes: 25,
      servings: 4,
      tagIds: [],
    })

    expect(updated.title).toBe('Pasta Carbonara')
    expect(updated.ingredients).toEqual(['400g spaghetti', '200g pancetta'])
  })

  it('updates tag associations', async () => {
    const db = createTestDb()
    const tag1 = await createTestTag(db, 'Italienskt')
    const tag2 = await createTestTag(db, 'Snabblagat')
    const recipe = await createTestRecipe(db, { title: 'Pasta', tagIds: [tag1.id] })

    await updateRecipe(db, recipe.id, {
      title: 'Pasta',
      ingredients: ['pasta'],
      tagIds: [tag2.id],
    })

    const fetched = await getRecipeById(db, recipe.id)
    expect(fetched!.tags).toHaveLength(1)
    expect(fetched!.tags[0].name).toBe('Snabblagat')
  })
})

describe('deleteRecipe', () => {
  it('removes the recipe so it no longer exists', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Pasta' })

    await deleteRecipe(db, recipe.id)

    const fetched = await getRecipeById(db, recipe.id)
    expect(fetched).toBeNull()
  })
})

describe('searchRecipes', () => {
  it('finds recipes matching title', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Köttfärssås', ingredients: ['köttfärs'] })

    const results = await searchRecipes(db, { query: 'pasta' })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Pasta Carbonara')
  })

  it('finds recipes matching ingredients', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Stekt ris', ingredients: ['ris', 'ägg', 'soja'] })
    await createTestRecipe(db, { title: 'Pasta' })

    const results = await searchRecipes(db, { query: 'soja' })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Stekt ris')
  })

  it('filters by tags', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Snabblagat')
    await createTestRecipe(db, { title: 'Snabb pasta', tagIds: [tag.id] })
    await createTestRecipe(db, { title: 'Långkok', ingredients: ['kött'] })

    const results = await searchRecipes(db, { tagIds: [tag.id] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Snabb pasta')
  })

  it('combines text search and tag filter', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Snabblagat')
    await createTestRecipe(db, { title: 'Snabb pasta', tagIds: [tag.id] })
    await createTestRecipe(db, { title: 'Pasta gratin', ingredients: ['pasta', 'ost'] })
    await createTestRecipe(db, { title: 'Snabb sallad', ingredients: ['sallad'], tagIds: [tag.id] })

    const results = await searchRecipes(db, { query: 'pasta', tagIds: [tag.id] })

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Snabb pasta')
  })

  it('returns all recipes when no filters are provided', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'A' })
    await createTestRecipe(db, { title: 'B' })

    const results = await searchRecipes(db, {})

    expect(results).toHaveLength(2)
  })
})
