import { chat, toServerSentEventsResponse, maxIterations } from '@tanstack/ai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import type { Database } from '#/db/types'
import type { VectorSearch } from '#/vector/search'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'
import { createRecipeSearch } from '#/recipes/search'
import { getAllTags } from '#/tags/crud'
import { getMenu, addToMenu } from '#/menu/crud'
import type { getAllRecipes } from '#/recipes/crud'

export type ChatDeps = {
  db: Database
  openaiApiKey: string
  appSecret: string
  vectorSearch: VectorSearch
}

export type ChatService = {
  handleRequest: (request: Request) => Promise<Response>
}

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

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

VIKTIGT om sökning:
- Verktyget search_recipes använder semantisk sökning. Skriv alltid en beskrivande sökfras, t.ex. "snabba barnvänliga rätter" eller "enkel vegetarisk pasta".
- ALLTID sök med search_recipes INNAN du svarar på frågor om recept. Svara ALDRIG att recept inte finns utan att först ha sökt.
- Om sökningen ger tomt resultat, GE INTE UPP. Prova igen med en kortare eller annorlunda formulering. Exempel: om "krämig kycklingpasta" ger tomt, prova "kyckling" eller "pasta". Gör minst 2-3 sökningar innan du säger att inget hittades.
- Inkludera kategori, önskemål och begränsningar direkt i sökfrasen istället för att använda separata filter.
- Du kan bedöma kosttyp genom att titta på ingredienserna.
- Använd maxCookingTimeMinutes-parametern om användaren anger en specifik tidsgräns.
- Använd cookCount och lastCookedAt för att svara på frågor om matlagningshistorik.
- När du presenterar resultat, visa ALLA relevanta träffar, inte bara det bästa resultatet.

VIKTIGT om veckomenyn:
- Verktyget get_weekly_menu hämtar aktuella planerade recept.
- Verktyget add_to_weekly_menu lägger till ett recept via dess ID. Använd det när du rekommenderar ett recept och användaren vill lägga till det.

Regler:
- Svara alltid på svenska
- Varje recept i sökresultatet har ett "url"-fält. Använd det exakt som det är för att skapa markdown-länkar. Exempel: om ett recept har url "/recipes/5" och titel "Pasta Carbonara", skriv [Pasta Carbonara](/recipes/5)
- Ge en kort beskrivning av receptet men länka till det istället för att skriva ut hela receptet, om inte användaren explicit ber om detaljer
- Om du inte hittar något passande, säg det
- Var kortfattad och tydlig
- Formatera inköpslistor och veckomenyer på ett lättläst sätt med markdown
- Basera ALLA förslag på användarens egna receptsamling. Hitta aldrig på recept.
- Om meddelandet börjar med [KONTEXT: ...] innehåller det information om vilken sida användaren befinner sig på. Använd den informationen för att förstå vad användaren syftar på med "det här receptet" eller liknande.`


const createTools = (db: Database, vectorSearch: VectorSearch) => {
  const searchRecipesDef = toolDefinition({
    name: 'search_recipes',
    description:
      'Sök efter recept i användarens receptsamling med semantisk sökning. Skriv alltid en beskrivande sökfras, t.ex. "snabba barnvänliga rätter" eller "vegetarisk pasta". Returnerar recept rankade efter relevans.',
    inputSchema: z.object({
      query: z.string().describe('Beskrivande sökfras på naturligt språk (t.ex. "enkel vegetarisk middag", "barnvänligt under 30 min")'),
      tags: z
        .array(z.string())
        .optional()
        .describe('Filtrera på taggnamn (t.ex. ["Pasta", "Barnvänligt"]). Använd EXAKT de taggnamn som finns i samlingen.'),
      maxCookingTimeMinutes: z
        .number()
        .optional()
        .describe('Max tillagningstid i minuter'),
    }),
  })

  const searchRecipesTool = searchRecipesDef.server(
    async ({ query, tags, maxCookingTimeMinutes }) => {
      const search = createRecipeSearch(db, (q) =>
        vectorSearch.findSimilar({ query: q, topK: 20 }),
      )
      const results = await search.search({ query, tags, maxCookingTimeMinutes })
      return results.map(formatResult)
    },
  )

  const getWeeklyMenuDef = toolDefinition({
    name: 'get_weekly_menu',
    description:
      'Hämta användarens veckomenyn. Returnerar alla planerade recept med titel, tillagningstid, portioner och om de är tillagade.',
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

  return [searchRecipesTool, getWeeklyMenuTool, addToWeeklyMenuTool]
}

const parseCookie = (cookieHeader: string, name: string): string | undefined => {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match?.[1]
}

const buildSystemPrompt = (tagNames: string[]): string => {
  const tagSection = tagNames.length > 0
    ? `\n\nTillgängliga taggar i användarens samling: ${tagNames.join(', ')}\nAnvänd EXAKT dessa taggnamn i tags-parametern vid sökning.`
    : ''
  return SYSTEM_PROMPT + tagSection
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

    const tags = await getAllTags(deps.db)
    const tagNames = tags.map((t) => t.name)

    const tools = createTools(deps.db, deps.vectorSearch)

    const stream = chat({
      adapter: createOpenaiChat('gpt-4.1-mini', deps.openaiApiKey),
      systemPrompts: [buildSystemPrompt(tagNames)],
      messages,
      conversationId,
      tools,
      agentLoopStrategy: maxIterations(12),
    })

    return toServerSentEventsResponse(stream)
  },
})
