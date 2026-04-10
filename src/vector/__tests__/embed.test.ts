import { describe, it, expect } from 'vitest'
import { buildEmbeddingText } from '#/vector/embed'

describe('buildEmbeddingText', () => {
  it('includes all fields when present', () => {
    const result = buildEmbeddingText({
      title: 'Pasta Carbonara',
      tags: ['Italienskt', 'Snabblagat'],
      description: 'Klassisk krämig pasta',
      cookingTimeMinutes: 25,
    })

    expect(result).toBe('Pasta Carbonara | Italienskt, Snabblagat | Klassisk krämig pasta | 25 min')
  })

  it('omits tags when empty', () => {
    const result = buildEmbeddingText({
      title: 'Enkel soppa',
      tags: [],
      description: 'Snabb vardagsmat',
      cookingTimeMinutes: 15,
    })

    expect(result).toBe('Enkel soppa | Snabb vardagsmat | 15 min')
  })

  it('omits description when null', () => {
    const result = buildEmbeddingText({
      title: 'Pannkakor',
      tags: ['Barnvänligt'],
      description: null,
      cookingTimeMinutes: 30,
    })

    expect(result).toBe('Pannkakor | Barnvänligt | 30 min')
  })

  it('omits cooking time when null', () => {
    const result = buildEmbeddingText({
      title: 'Sallad',
      tags: ['Lunch'],
      description: 'Fräsch sallad',
      cookingTimeMinutes: null,
    })

    expect(result).toBe('Sallad | Lunch | Fräsch sallad')
  })

  it('returns only title when all other fields are empty/null', () => {
    const result = buildEmbeddingText({
      title: 'Smörgås',
      tags: [],
      description: null,
      cookingTimeMinutes: null,
    })

    expect(result).toBe('Smörgås')
  })
})
