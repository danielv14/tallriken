import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { getMenu, addToMenu } from '#/menu/crud'

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
