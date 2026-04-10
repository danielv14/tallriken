import type { RecipeDraft } from '#/import/schema'

const JSON_LD_REGEX = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

const parseIsoDuration = (duration: string): number | undefined => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return undefined
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const total = hours * 60 + minutes
  return total > 0 ? total : undefined
}

const parseServings = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return undefined
  const match = value.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

const parseInstructions = (instructions: unknown): string[] | undefined => {
  if (!instructions) return undefined

  if (typeof instructions === 'string') {
    return instructions.trim() ? [instructions.trim()] : undefined
  }

  if (Array.isArray(instructions)) {
    const steps = instructions
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'text' in item) return String(item.text).trim()
        return ''
      })
      .filter(Boolean)
    return steps.length > 0 ? steps : undefined
  }

  return undefined
}

const findRecipeInJsonLd = (data: unknown): Record<string, unknown> | null => {
  if (!data || typeof data !== 'object') return null

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
    return null
  }

  const obj = data as Record<string, unknown>

  const type = obj['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return obj

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    return findRecipeInJsonLd(obj['@graph'])
  }

  return null
}

export const extractImageUrl = (html: string): string | null => {
  const jsonLdMatches = [...html.matchAll(JSON_LD_REGEX)]
  for (const match of jsonLdMatches) {
    try {
      const parsed = JSON.parse(match[1])
      const recipe = findRecipeInJsonLd(parsed)
      if (!recipe) continue

      const image = recipe.image
      if (typeof image === 'string') return image
      if (Array.isArray(image) && typeof image[0] === 'string') return image[0]
      if (image && typeof image === 'object' && 'url' in image) return String(image.url)
    } catch {
      continue
    }
  }

  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (ogMatch?.[1]) return ogMatch[1]

  return null
}

export const extractJsonLdRecipe = (html: string): RecipeDraft | null => {
  const matches = [...html.matchAll(JSON_LD_REGEX)]

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1])
      const recipe = findRecipeInJsonLd(parsed)

      if (!recipe) continue

      const title = recipe.name as string | undefined
      const ingredients = recipe.recipeIngredient as string[] | undefined

      if (!title || !ingredients || ingredients.length === 0) continue

      return {
        title,
        description: (recipe.description as string) ?? null,
        ingredients: [{ group: null, items: ingredients }],
        steps: parseInstructions(recipe.recipeInstructions) ?? null,
        cookingTimeMinutes: recipe.totalTime
          ? parseIsoDuration(recipe.totalTime as string) ?? null
          : recipe.cookTime
            ? parseIsoDuration(recipe.cookTime as string) ?? null
            : null,
        servings: parseServings(recipe.recipeYield) ?? null,
        suggestedTagNames: null,
      }
    } catch {
      continue
    }
  }

  return null
}
