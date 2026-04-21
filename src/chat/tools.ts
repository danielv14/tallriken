import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import type { Database } from '#/db/types'
import { getMenu, addToMenu } from '#/menu/crud'

export const createTools = (db: Database) => {
  const getWeeklyMenuDef = toolDefinition({
    name: 'get_weekly_menu',
    description:
      'Hämta användarens veckomeny. Returnerar alla planerade recept med titel, tillagningstid, portioner och om de är tillagade.',
    inputSchema: z.object({}),
  })

  const getWeeklyMenuTool = getWeeklyMenuDef.server(async () => {
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
  })

  const addToWeeklyMenuTool = addToWeeklyMenuDef.server(async ({ recipeId }) => {
    try {
      await addToMenu(db, recipeId)
      return { success: true, message: `Receptet har lagts till i veckomenyn.` }
    } catch {
      return { success: false, message: `Kunde inte lägga till receptet. Kontrollera att recept-ID:t är korrekt.` }
    }
  })

  return [getWeeklyMenuTool, addToWeeklyMenuTool]
}
