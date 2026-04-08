import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { getAllRecipes } from '#/recipes/crud'

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
  description: 'Hämta alla recept i användarens receptsamling. Returnerar samtliga recept med titel, beskrivning, ingredienser, tillagningstid, taggar och länk. Du filtrerar och analyserar resultaten själv baserat på användarens fråga.',
  inputSchema: z.object({}),
  outputSchema: z.array(recipeResultSchema),
})

export const searchRecipesTool = searchRecipesDef.server(async () => {
  console.log('[search_recipes] Fetching all recipes')
  const db = getDb()
  const results = await getAllRecipes(db)
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
