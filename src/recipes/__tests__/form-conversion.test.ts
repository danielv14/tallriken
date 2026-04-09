import { describe, it, expect } from 'vitest'
import { Recipe, recipeInputSchema, recipeFormSchema } from '#/recipes/recipe'

describe('Recipe.fromForm', () => {
  it('converts a single ungrouped ingredient group', () => {
    const result = Recipe.fromForm({
      title: 'Pasta',
      description: 'Gott',
      ingredientGroups: [{ group: '', items: ['400g pasta', '2 ägg'] }],
      steps: ['Koka', 'Blanda'],
      cookingTimeMinutes: '30',
      servings: '4',
      tagIds: [1, 2],
    })

    expect(result.ingredients).toEqual([{ group: null, items: ['400g pasta', '2 ägg'] }])
    expect(result.cookingTimeMinutes).toBe(30)
    expect(result.servings).toBe(4)
  })

  it('converts multiple named ingredient groups', () => {
    const result = Recipe.fromForm({
      title: 'Pizza',
      description: '',
      ingredientGroups: [
        { group: 'Pizzadeg', items: ['12g jäst', '2 dl vatten'] },
        { group: 'Topping', items: ['tomatsås', 'ost'] },
      ],
      steps: ['Baka'],
      cookingTimeMinutes: '60',
      servings: '4',
      tagIds: [],
    })

    expect(result.ingredients).toEqual([
      { group: 'Pizzadeg', items: ['12g jäst', '2 dl vatten'] },
      { group: 'Topping', items: ['tomatsås', 'ost'] },
    ])
  })

  it('filters out empty items and empty groups', () => {
    const result = Recipe.fromForm({
      title: 'Test',
      description: '',
      ingredientGroups: [
        { group: 'Deg', items: ['mjöl', '', '  '] },
        { group: 'Tom grupp', items: ['', ''] },
      ],
      steps: [],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.ingredients).toEqual([
      { group: 'Deg', items: ['mjöl'] },
    ])
  })

  it('handles empty optional fields', () => {
    const result = Recipe.fromForm({
      title: 'Pasta',
      description: '',
      ingredientGroups: [{ group: '', items: ['pasta'] }],
      steps: [''],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.description).toBeUndefined()
    expect(result.steps).toBeUndefined()
    expect(result.cookingTimeMinutes).toBeUndefined()
    expect(result.servings).toBeUndefined()
  })

  it('trims whitespace', () => {
    const result = Recipe.fromForm({
      title: '  Pasta  ',
      description: '  Gott  ',
      ingredientGroups: [{ group: '  Deg  ', items: ['  mjöl  '] }],
      steps: ['  koka  '],
      cookingTimeMinutes: '30',
      servings: '4',
      tagIds: [],
    })

    expect(result.title).toBe('Pasta')
    expect(result.description).toBe('Gott')
    expect(result.ingredients).toEqual([{ group: 'Deg', items: ['mjöl'] }])
    expect(result.steps).toEqual(['koka'])
  })
})

describe('Recipe.toForm', () => {
  it('converts grouped ingredients to form data', () => {
    const result = Recipe.toForm({
      title: 'Pizza',
      description: null,
      ingredients: [
        { group: 'Deg', items: ['mjöl', 'vatten'] },
        { group: 'Topping', items: ['ost'] },
      ],
      steps: ['Baka'],
      cookingTimeMinutes: 60,
      servings: 4,
      tags: [],
    })

    expect(result.ingredientGroups).toEqual([
      { group: 'Deg', items: ['mjöl', 'vatten'] },
      { group: 'Topping', items: ['ost'] },
    ])
  })

  it('converts ungrouped ingredients', () => {
    const result = Recipe.toForm({
      title: 'Pasta',
      description: null,
      ingredients: [{ group: null, items: ['pasta', 'ägg'] }],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      tags: [],
    })

    expect(result.ingredientGroups).toEqual([
      { group: '', items: ['pasta', 'ägg'] },
    ])
  })

  it('handles null/missing fields', () => {
    const result = Recipe.toForm({
      title: 'Pasta',
      description: null,
      ingredients: [{ group: null, items: ['pasta'] }],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      tags: [],
    })

    expect(result.description).toBe('')
    expect(result.steps).toEqual([''])
    expect(result.cookingTimeMinutes).toBe('')
    expect(result.servings).toBe('')
  })
})

describe('Recipe.fromDraft', () => {
  it('converts a draft to form data', () => {
    const result = Recipe.fromDraft({
      title: 'Pasta Carbonara',
      description: 'Klassisk pasta',
      ingredients: [{ group: null, items: ['pasta', 'ägg', 'pecorino'] }],
      steps: ['Koka', 'Blanda'],
      cookingTimeMinutes: 20,
      servings: 4,
      suggestedTagNames: ['pasta'],
      tagIds: [1, 3],
    })

    expect(result.title).toBe('Pasta Carbonara')
    expect(result.description).toBe('Klassisk pasta')
    expect(result.ingredientGroups).toEqual([
      { group: '', items: ['pasta', 'ägg', 'pecorino'] },
    ])
    expect(result.steps).toEqual(['Koka', 'Blanda'])
    expect(result.cookingTimeMinutes).toBe('20')
    expect(result.servings).toBe('4')
    expect(result.tagIds).toEqual([1, 3])
  })

  it('handles null fields from AI extraction', () => {
    const result = Recipe.fromDraft({
      title: 'Enkel sallad',
      description: null,
      ingredients: [{ group: null, items: ['sallad'] }],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      suggestedTagNames: null,
      tagIds: [],
    })

    expect(result.description).toBe('')
    expect(result.steps).toEqual([''])
    expect(result.cookingTimeMinutes).toBe('')
    expect(result.servings).toBe('')
  })
})

describe('toForm and fromDraft produce identical output for equivalent inputs', () => {
  it('yields the same RecipeFormData from a DB recipe and a matching draft', () => {
    const dbResult = Recipe.toForm({
      title: 'Pizza',
      description: 'God pizza',
      ingredients: [
        { group: 'Deg', items: ['mjöl', 'vatten'] },
        { group: 'Topping', items: ['ost'] },
      ],
      steps: ['Knåda', 'Grädda'],
      cookingTimeMinutes: 45,
      servings: 2,
      tags: [{ id: 5, name: 'pizza' }],
    })

    const draftResult = Recipe.fromDraft({
      title: 'Pizza',
      description: 'God pizza',
      ingredients: [
        { group: 'Deg', items: ['mjöl', 'vatten'] },
        { group: 'Topping', items: ['ost'] },
      ],
      steps: ['Knåda', 'Grädda'],
      cookingTimeMinutes: 45,
      servings: 2,
      suggestedTagNames: ['pizza'],
      tagIds: [5],
    })

    expect(dbResult).toEqual(draftResult)
  })
})

describe('recipeInputSchema', () => {
  it('accepts valid recipe input', () => {
    const result = recipeInputSchema.safeParse({
      title: 'Pasta',
      ingredients: [{ group: null, items: ['pasta'] }],
      tagIds: [1],
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = recipeInputSchema.safeParse({
      title: '',
      ingredients: [{ group: null, items: ['pasta'] }],
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty ingredients', () => {
    const result = recipeInputSchema.safeParse({
      title: 'Pasta',
      ingredients: [],
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects ingredient groups with empty items', () => {
    const result = recipeInputSchema.safeParse({
      title: 'Pasta',
      ingredients: [{ group: null, items: [''] }],
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-positive cooking time', () => {
    const result = recipeInputSchema.safeParse({
      title: 'Pasta',
      ingredients: [{ group: null, items: ['pasta'] }],
      cookingTimeMinutes: -5,
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })
})

describe('recipeFormSchema', () => {
  it('accepts valid form data', () => {
    const result = recipeFormSchema.safeParse({
      title: 'Pasta',
      description: '',
      ingredientGroups: [{ group: '', items: ['pasta'] }],
      steps: ['Koka'],
      cookingTimeMinutes: '30',
      servings: '4',
      tagIds: [],
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = recipeFormSchema.safeParse({
      title: '',
      description: '',
      ingredientGroups: [{ group: '', items: ['pasta'] }],
      steps: ['Koka'],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects form with no ingredients', () => {
    const result = recipeFormSchema.safeParse({
      title: 'Pasta',
      description: '',
      ingredientGroups: [{ group: '', items: ['', ''] }],
      steps: ['Koka'],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-positive integer strings for cooking time', () => {
    const result = recipeFormSchema.safeParse({
      title: 'Pasta',
      description: '',
      ingredientGroups: [{ group: '', items: ['pasta'] }],
      steps: ['Koka'],
      cookingTimeMinutes: '-5',
      servings: '',
      tagIds: [],
    })

    expect(result.success).toBe(false)
  })

  it('allows empty strings for optional numeric fields', () => {
    const result = recipeFormSchema.safeParse({
      title: 'Pasta',
      description: '',
      ingredientGroups: [{ group: '', items: ['pasta'] }],
      steps: ['Koka'],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.success).toBe(true)
  })
})
