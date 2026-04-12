import { createFileRoute } from '@tanstack/react-router'
import { getCookie } from '@tanstack/react-start/server'
import { chat, toServerSentEventsResponse, maxIterations } from '@tanstack/ai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'
import { validateSessionToken } from '#/auth/session'
import { SESSION_COOKIE_NAME } from '#/auth/cookies'
import { getWeeklyMenuTool, addToWeeklyMenuTool } from '#/chat/tools'
import { buildRecipeIndex } from '#/chat/recipe-index'
import { getDb } from '#/db/client'
import { getAllRecipes } from '#/recipes/crud'

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

Du har tillgång till HELA användarens receptsamling nedan. Använd den för att svara på frågor direkt — du behöver inte söka.

Regler:
- Svara alltid på svenska
- Skapa markdown-länkar med receptets URL. Exempel: [Pasta Carbonara](/recipes/5)
- När du presenterar recept, lista ALLA relevanta träffar, inte bara ett. Ge en kort beskrivning av varje med en länk.
- Länka till receptet istället för att skriva ut hela receptet, om inte användaren explicit ber om detaljer
- Om du inte hittar något passande, säg det
- Var kortfattad och tydlig
- Formatera inköpslistor och veckomenyer på ett lättläst sätt med markdown
- Basera ALLA förslag på receptsamlingen nedan. Hitta aldrig på recept.
- Du kan bedöma kosttyp genom att titta på ingredienserna i receptlistan.
- Om meddelandet börjar med [KONTEXT: ...] innehåller det information om vilken sida användaren befinner sig på. Använd den informationen för att förstå vad användaren syftar på med "det här receptet" eller liknande.

VIKTIGT om veckomenyn:
- Verktyget get_weekly_menu hämtar aktuella planerade recept.
- Verktyget add_to_weekly_menu lägger till ett recept via dess ID.`

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sessionToken = getCookie(SESSION_COOKIE_NAME)
        if (!sessionToken || !validateSessionToken(sessionToken, env.APP_SECRET)) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { messages, conversationId } = (await request.json()) as {
          messages: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }>
          conversationId: string
        }

        const db = getDb()
        const recipes = await getAllRecipes(db)
        const recipeIndex = buildRecipeIndex(recipes)

        const stream = chat({
          adapter: createOpenaiChat('gpt-4o-mini', env.OPENAI_API_KEY),
          systemPrompts: [SYSTEM_PROMPT + `\n\nRECEPTSAMLING (${recipes.length} recept):\n\n` + recipeIndex],
          messages,
          conversationId,
          tools: [getWeeklyMenuTool, addToWeeklyMenuTool],
          agentLoopStrategy: maxIterations(5),
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
