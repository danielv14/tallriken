import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { searchRecipes } from '#/recipes/crud'

const searchRecipesDef = toolDefinition({
  name: 'search_recipes',
  description: 'Sök bland användarens sparade recept. Använd detta verktyg när användaren frågar efter recept, föreslår ingredienser, eller vill ha matförslag. Returnerar matchande recept med titel, beskrivning, ingredienser, taggar och tillagningstid.',
  inputSchema: z.object({
    query: z.string().optional().describe('Fritext-sökning, t.ex. "pasta", "kyckling", "snabbt"'),
    tagIds: z.array(z.number()).optional().describe('Filtrera på specifika tagg-ID:n'),
  }),
})

export const searchRecipesTool = searchRecipesDef.server(async ({ query, tagIds }) => {
  const db = getDb()
  const results = await searchRecipes(db, { query, tagIds })

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    ingredients: r.ingredients.flatMap((g) =>
      g.group ? [`**${g.group}:**`, ...g.items] : g.items,
    ),
    cookingTimeMinutes: r.cookingTimeMinutes,
    servings: r.servings,
    tags: r.tags.map((t) => t.name),
  }))
})
