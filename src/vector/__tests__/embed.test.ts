import { describe, it, expect } from 'vitest'
import { buildEmbeddingText } from '#/vector/embed'

describe('buildEmbeddingText', () => {
  it('includes all fields when present', () => {
    const result = buildEmbeddingText({
      title: 'Pasta Carbonara',
      tags: ['Italienskt', 'Snabblagat'],
      description: 'Klassisk krämig pasta',
      ingredients: ['pasta', 'ägg', 'parmesan', 'pancetta'],
      cookingTimeMinutes: 25,
    })

    expect(result).toBe('Pasta Carbonara | Italienskt, Snabblagat | Klassisk krämig pasta | pasta, ägg, parmesan, pancetta | 25 min')
  })

  it('omits tags when empty', () => {
    const result = buildEmbeddingText({
      title: 'Enkel soppa',
      tags: [],
      description: 'Snabb vardagsmat',
      ingredients: ['morot', 'lök'],
      cookingTimeMinutes: 15,
    })

    expect(result).toBe('Enkel soppa | Snabb vardagsmat | morot, lök | 15 min')
  })

  it('omits description when null', () => {
    const result = buildEmbeddingText({
      title: 'Pannkakor',
      tags: ['Barnvänligt'],
      description: null,
      ingredients: ['mjöl', 'ägg', 'mjölk'],
      cookingTimeMinutes: 30,
    })

    expect(result).toBe('Pannkakor | Barnvänligt | mjöl, ägg, mjölk | 30 min')
  })

  it('omits cooking time when null', () => {
    const result = buildEmbeddingText({
      title: 'Sallad',
      tags: ['Lunch'],
      description: 'Fräsch sallad',
      ingredients: ['sallad', 'tomat'],
      cookingTimeMinutes: null,
    })

    expect(result).toBe('Sallad | Lunch | Fräsch sallad | sallad, tomat')
  })

  it('returns only title when all other fields are empty/null', () => {
    const result = buildEmbeddingText({
      title: 'Smörgås',
      tags: [],
      description: null,
      ingredients: [],
      cookingTimeMinutes: null,
    })

    expect(result).toBe('Smörgås')
  })

  it('omits ingredients when empty', () => {
    const result = buildEmbeddingText({
      title: 'Snabbmat',
      tags: ['Snabbt'],
      description: null,
      ingredients: [],
      cookingTimeMinutes: 10,
    })

    expect(result).toBe('Snabbmat | Snabbt | 10 min')
  })
})
