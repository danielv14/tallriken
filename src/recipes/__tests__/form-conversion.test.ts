import { describe, it, expect } from 'vitest'
import { formDataToRecipeInput, recipeToFormData, type IngredientGroupFormData } from '#/recipes/form-utils'

describe('formDataToRecipeInput', () => {
  it('converts a single ungrouped ingredient group', () => {
    const result = formDataToRecipeInput({
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
    const result = formDataToRecipeInput({
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
    const result = formDataToRecipeInput({
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
    const result = formDataToRecipeInput({
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
    const result = formDataToRecipeInput({
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

describe('recipeToFormData', () => {
  it('converts grouped ingredients to form data', () => {
    const result = recipeToFormData({
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
    const result = recipeToFormData({
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
    const result = recipeToFormData({
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
