import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipeSearch } from '#/recipes/search'
import type { getAllRecipes } from '#/recipes/crud'
import { getVectorSearch } from '#/vector/client'
import { getMenu, addToMenu } from '#/menu/crud'

type CompactRecipeResult = {
  id: number
  title: string
  description: string | null
  ingredients: string[]
  cookingTimeMinutes: number | null
  servings: number | null
  tags: string[]
  cookCount: number
  lastCookedAt: string | null
  url: string
}

const formatResult = (r: Awaited<ReturnType<typeof getAllRecipes>>[number]): CompactRecipeResult => ({
  id: r.id,
  title: r.title,
  description: r.description,
  ingredients: r.ingredients.flatMap((g) =>
    g.group ? [`[${g.group}]`, ...g.items] : g.items,
  ),
  cookingTimeMinutes: r.cookingTimeMinutes,
  servings: r.servings,
  tags: r.tags.map((t) => t.name),
  cookCount: r.cookCount,
  lastCookedAt: r.lastCookedAt?.toISOString() ?? null,
  url: `/recipes/${r.id}`,
})

const recipeResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  cookingTimeMinutes: z.number().nullable(),
  servings: z.number().nullable(),
  tags: z.array(z.string()),
  cookCount: z.number(),
  lastCookedAt: z.string().nullable(),
  url: z.string(),
})

const searchRecipesDef = toolDefinition({
  name: 'search_recipes',
  description:
    'Sök efter recept i användarens receptsamling med semantisk sökning. Skriv alltid en beskrivande sökfras, t.ex. "snabba barnvänliga rätter" eller "vegetarisk pasta". Returnerar recept rankade efter relevans.',
  inputSchema: z.object({
    query: z.string().describe('Beskrivande sökfras på naturligt språk (t.ex. "enkel vegetarisk middag", "barnvänligt under 30 min")'),
    maxCookingTimeMinutes: z
      .number()
      .optional()
      .describe('Max tillagningstid i minuter'),
  }),
  outputSchema: z.array(recipeResultSchema),
})

export const searchRecipesTool = searchRecipesDef.server(
  async ({ query, maxCookingTimeMinutes }) => {
    const db = getDb()
    const vectorSearch = getVectorSearch()
    const search = createRecipeSearch(db, (q) =>
      vectorSearch.findSimilar({ query: q, topK: 15 }),
    )
    const results = await search.search({ query, maxCookingTimeMinutes })
    return results.map(formatResult)
  },
)

const menuItemSchema = z.object({
  recipeId: z.number(),
  title: z.string(),
  cookingTimeMinutes: z.number().nullable(),
  servings: z.number().nullable(),
  cooked: z.boolean(),
})

const getWeeklyMenuDef = toolDefinition({
  name: 'get_weekly_menu',
  description:
    'Hämta användarens veckomenyn. Returnerar alla planerade recept med titel, tillagningstid, portioner och om de är tillagade.',
  inputSchema: z.object({}),
  outputSchema: z.array(menuItemSchema),
})

export const getWeeklyMenuTool = getWeeklyMenuDef.server(async () => {
  const db = getDb()
  const menu = await getMenu(db)
  return menu.map((item) => ({
    recipeId: item.recipe.id,
    title: item.recipe.title,
    cookingTimeMinutes: item.recipe.cookingTimeMinutes,
    servings: item.recipe.servings,
    cooked: !!item.completedAt,
  }))
})

const addToWeeklyMenuDef = toolDefinition({
  name: 'add_to_weekly_menu',
  description:
    'Lägg till ett recept i användarens veckomeny. Tar ett recept-ID. Returnerar bekräftelse eller felmeddelande om receptet redan finns i menyn.',
  inputSchema: z.object({
    recipeId: z.number().describe('ID för receptet som ska läggas till'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
})

export const addToWeeklyMenuTool = addToWeeklyMenuDef.server(async ({ recipeId }) => {
  const db = getDb()
  try {
    await addToMenu(db, recipeId)
    return { success: true, message: `Receptet har lagts till i veckomenyn.` }
  } catch {
    return { success: false, message: `Kunde inte lägga till receptet. Kontrollera att recept-ID:t är korrekt.` }
  }
})
