import { describe, it, expect } from 'vitest'
import { formDataToRecipeInput, recipeToFormData } from '#/recipes/form-utils'

describe('formDataToRecipeInput', () => {
  it('converts string fields to numbers', () => {
    const result = formDataToRecipeInput({
      title: 'Pasta',
      description: 'Gott',
      ingredients: ['400g pasta', '2 ägg'],
      steps: ['Koka', 'Blanda'],
      cookingTimeMinutes: '30',
      servings: '4',
      tagIds: [1, 2],
    })

    expect(result.title).toBe('Pasta')
    expect(result.description).toBe('Gott')
    expect(result.ingredients).toEqual(['400g pasta', '2 ägg'])
    expect(result.steps).toEqual(['Koka', 'Blanda'])
    expect(result.cookingTimeMinutes).toBe(30)
    expect(result.servings).toBe(4)
    expect(result.tagIds).toEqual([1, 2])
  })

  it('handles empty optional fields', () => {
    const result = formDataToRecipeInput({
      title: 'Pasta',
      description: '',
      ingredients: ['pasta'],
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

  it('filters out empty ingredients and steps', () => {
    const result = formDataToRecipeInput({
      title: 'Pasta',
      description: '',
      ingredients: ['pasta', '', '  ', 'ost'],
      steps: ['koka', '', 'servera'],
      cookingTimeMinutes: '',
      servings: '',
      tagIds: [],
    })

    expect(result.ingredients).toEqual(['pasta', 'ost'])
    expect(result.steps).toEqual(['koka', 'servera'])
  })

  it('trims whitespace from all string values', () => {
    const result = formDataToRecipeInput({
      title: '  Pasta  ',
      description: '  Gott  ',
      ingredients: ['  pasta  ', '  ost  '],
      steps: ['  koka  '],
      cookingTimeMinutes: '30',
      servings: '4',
      tagIds: [],
    })

    expect(result.title).toBe('Pasta')
    expect(result.description).toBe('Gott')
    expect(result.ingredients).toEqual(['pasta', 'ost'])
    expect(result.steps).toEqual(['koka'])
  })
})

describe('recipeToFormData', () => {
  it('converts number fields to strings', () => {
    const result = recipeToFormData({
      title: 'Pasta',
      description: 'Gott',
      ingredients: ['pasta'],
      steps: ['koka'],
      cookingTimeMinutes: 30,
      servings: 4,
      tags: [{ id: 1, name: 'Snabblagat' }],
    })

    expect(result.cookingTimeMinutes).toBe('30')
    expect(result.servings).toBe('4')
    expect(result.tagIds).toEqual([1])
  })

  it('handles null/missing fields', () => {
    const result = recipeToFormData({
      title: 'Pasta',
      description: null,
      ingredients: ['pasta'],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      tags: [],
    })

    expect(result.description).toBe('')
    expect(result.steps).toEqual([''])
    expect(result.cookingTimeMinutes).toBe('')
    expect(result.servings).toBe('')
    expect(result.tagIds).toEqual([])
  })
})
