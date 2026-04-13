import { chat, toServerSentEventsResponse, maxIterations } from '@tanstack/ai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import type { Database } from '#/db/types'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'
import { getAllRecipes } from '#/recipes/crud'
import { getMenu, addToMenu } from '#/menu/crud'
import { buildRecipeIndex } from '#/chat/recipe-index'

export type ChatDeps = {
  db: Database
  openaiApiKey: string
  appSecret: string
}

export type ChatService = {
  handleRequest: (request: Request) => Promise<Response>
}

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

Du har tillgång till HELA användarens receptsamling nedan. Använd den direkt for att svara på frågor om recept.

Regler:
- Svara alltid på svenska
- Skapa markdown-länkar med receptets URL. Exempel: om ett recept har ID 5 och titel "Pasta Carbonara", skriv [Pasta Carbonara](/recipes/5)
- När du presenterar recept, lista ALLA relevanta träffar med en kort beskrivning och länk
- Ge en kort beskrivning men länka till receptet istället för att skriva ut hela, om inte användaren explicit ber om detaljer
- Var kortfattad och tydlig
- Formatera inköpslistor och veckomenyer på ett lättläst sätt med markdown
- Basera ALLA förslag på receptsamlingen nedan. Hitta aldrig på recept.
- Du kan bedöma kosttyp genom att titta på ingredienserna i receptlistan.
- Om meddelandet börjar med [KONTEXT: ...] innehåller det information om vilken sida användaren befinner sig på. Använd den informationen för att förstå vad användaren syftar på med "det här receptet" eller liknande.

VIKTIGT om veckomenyn:
- Verktyget get_weekly_menu hämtar aktuella planerade recept.
- Verktyget add_to_weekly_menu lägger till ett recept via dess ID.`

const createTools = (db: Database) => {
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

const parseCookie = (cookieHeader: string, name: string): string | undefined => {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match?.[1]
}

export const createChatService = (deps: ChatDeps): ChatService => ({
  handleRequest: async (request: Request): Promise<Response> => {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE_NAME)

    if (!sessionToken || !validateSessionToken(sessionToken, deps.appSecret)) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = (await request.json()) as {
      messages: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }>
      conversationId: string
    }

    const recipes = await getAllRecipes(deps.db)
    const recipeIndex = buildRecipeIndex(recipes)

    const tools = createTools(deps.db)

    const stream = chat({
      adapter: createOpenaiChat('gpt-4.1-mini', deps.openaiApiKey),
      systemPrompts: [SYSTEM_PROMPT + `\n\nRECEPTSAMLING (${recipes.length} recept):\n\n` + recipeIndex],
      messages,
      conversationId,
      tools,
      agentLoopStrategy: maxIterations(12),
    })

    return toServerSentEventsResponse(stream)
  },
})
