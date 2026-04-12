import { describe, it, expect } from 'vitest'
import { buildRecipeIndex } from '#/chat/recipe-index'

const makeRecipe = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Pasta Carbonara',
  description: 'Krämig italiensk pasta',
  ingredients: [{ group: null, items: ['pasta', 'ägg', 'pecorino', 'guanciale'] }],
  steps: ['Koka pasta', 'Stek guanciale'],
  cookingTimeMinutes: 25,
  servings: 4,
  sourceUrl: null,
  imageUrl: null,
  lastCookedAt: null,
  cookCount: 0,
  createdAt: new Date(),
  tags: [{ id: 1, name: 'Pasta' }],
  ...overrides,
})

describe('buildRecipeIndex', () => {
  it('returns empty message for no recipes', () => {
    expect(buildRecipeIndex([])).toBe('Receptsamlingen är tom.')
  })

  it('includes title, metadata, and URL', () => {
    const result = buildRecipeIndex([makeRecipe()])

    expect(result).toContain('#1 Pasta Carbonara')
    expect(result).toContain('25 min')
    expect(result).toContain('4 port')
    expect(result).toContain('Pasta')
    expect(result).toContain('/recipes/1')
  })

  it('includes ingredients', () => {
    const result = buildRecipeIndex([makeRecipe()])

    expect(result).toContain('pasta')
    expect(result).toContain('guanciale')
  })

  it('includes description', () => {
    const result = buildRecipeIndex([makeRecipe()])

    expect(result).toContain('Krämig italiensk pasta')
  })

  it('includes cook count and last cooked date', () => {
    const result = buildRecipeIndex([makeRecipe({
      cookCount: 5,
      lastCookedAt: new Date('2026-03-15T12:00:00Z'),
    })])

    expect(result).toContain('lagat 5 ggr')
    expect(result).toContain('senast 2026-03-15')
  })

  it('omits stats for never-cooked recipes', () => {
    const result = buildRecipeIndex([makeRecipe()])

    expect(result).not.toContain('lagat')
    expect(result).not.toContain('senast')
  })

  it('handles recipes without optional fields', () => {
    const result = buildRecipeIndex([makeRecipe({
      description: null,
      cookingTimeMinutes: null,
      servings: null,
      tags: [],
    })])

    expect(result).toContain('#1 Pasta Carbonara')
    expect(result).toContain('/recipes/1')
    expect(result).not.toContain('min')
    expect(result).not.toContain('port')
  })

  it('handles multiple ingredient groups', () => {
    const result = buildRecipeIndex([makeRecipe({
      ingredients: [
        { group: 'Pasta', items: ['spaghetti', 'salt'] },
        { group: 'Sås', items: ['ägg', 'pecorino'] },
      ],
    })])

    expect(result).toContain('spaghetti')
    expect(result).toContain('pecorino')
  })

  it('formats multiple recipes', () => {
    const recipes = [
      makeRecipe({ id: 1, title: 'Pasta Carbonara' }),
      makeRecipe({ id: 2, title: 'Pad Thai', tags: [{ id: 2, name: 'Thai' }] }),
    ]

    const result = buildRecipeIndex(recipes)

    expect(result).toContain('#1 Pasta Carbonara')
    expect(result).toContain('#2 Pad Thai')
    expect(result).toContain('Thai')
  })
})
