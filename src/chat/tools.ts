import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createRecipeSearch } from '#/chat/recipe-search'
import { getMenu, addToMenu } from '#/menu/crud'

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
    'Sök efter recept i användarens receptsamling. Returnerar recept som matchar sökfrasen med titel, beskrivning, ingredienser, tillagningstid, taggar, antal gånger lagat och senast lagat.',
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
    const results = await search.search(query, { maxCookingTimeMinutes, tags })
    return results.map((r) => ({
      ...r,
      lastCookedAt: r.lastCookedAt?.toISOString() ?? null,
    }))
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
