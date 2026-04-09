import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipeSearch } from '#/chat/recipe-search'

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
  description:
    'Sök efter recept i användarens receptsamling. Returnerar recept som matchar sökfrasen med titel, beskrivning, ingredienser, tillagningstid, taggar och länk.',
  inputSchema: z.object({
    query: z.string().describe('Sökfras (ingrediens, mattitel, typ av rätt etc)'),
    maxCookingTimeMinutes: z
      .number()
      .optional()
      .describe('Max tillagningstid i minuter'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Filtrera på taggar (t.ex. ["Vegetariskt", "Snabbt"])'),
  }),
  outputSchema: z.array(recipeResultSchema),
})

export const searchRecipesTool = searchRecipesDef.server(
  async ({ query, maxCookingTimeMinutes, tags }) => {
    const db = getDb()
    const search = createRecipeSearch(db)
    return search.search(query, { maxCookingTimeMinutes, tags })
  },
)
