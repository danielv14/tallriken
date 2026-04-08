import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { searchRecipes } from '#/recipes/crud'

const recipeResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  cookingTimeMinutes: z.number().nullable(),
  servings: z.number().nullable(),
  tags: z.array(z.string()),
  url: z.string(),
})

const searchRecipesDef = toolDefinition({
  name: 'search_recipes',
  description: 'Sök bland användarens sparade recept. Returnerar en sammanfattning med länk till varje recept. Använd detta när användaren frågar efter recept, föreslår ingredienser, eller vill ha matförslag. Stödjer filtrering på tillagningstid. Ingredienslistor inkluderas så du kan bedöma kosttyp (vegetariskt, etc).',
  inputSchema: z.object({
    query: z.string().optional().describe('Fritext-sökning, t.ex. "pasta", "kyckling"'),
    tagIds: z.array(z.number()).optional().describe('Filtrera på specifika tagg-ID:n'),
    maxCookingTimeMinutes: z.number().optional().describe('Max tillagningstid i minuter. Använd BARA om användaren explicit ber om snabba recept eller anger en tidsgräns. Lämna tomt annars.'),
  }),
  outputSchema: z.array(recipeResultSchema),
})

export const searchRecipesTool = searchRecipesDef.server(async ({ query, tagIds, maxCookingTimeMinutes }) => {
  console.log('[search_recipes] Called with:', { query, tagIds, maxCookingTimeMinutes })
  const db = getDb()
  const results = await searchRecipes(db, { query, tagIds, maxCookingTimeMinutes })
  console.log('[search_recipes] Found', results.length, 'recipes')

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    ingredients: r.ingredients.flatMap((g) =>
      g.group ? [`[${g.group}]`, ...g.items] : g.items,
    ),
    cookingTimeMinutes: r.cookingTimeMinutes,
    servings: r.servings,
    tags: r.tags.map((t) => t.name),
    url: `/recipes/${r.id}`,
  }))
})
