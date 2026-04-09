import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse, maxIterations } from '@tanstack/ai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'
import { searchRecipesTool, getWeeklyMenuTool, addToWeeklyMenuTool } from '#/chat/tools'
import { getDb } from '#/db/client'
import { getAllTags } from '#/tags/crud'

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

VIKTIGT om sökning:
- Verktyget search_recipes söker efter recept med sökfras, taggar och max tillagningstid. Resultaten inkluderar cookCount och lastCookedAt.
- ALLTID sök med search_recipes INNAN du svarar på frågor om recept. Svara ALDRIG att recept inte finns utan att först ha sökt.
- När användaren nämner en kategori (t.ex. "barnvänligt", "vegetariskt"), matcha mot de tillgängliga taggarna (listas i slutet av denna prompt) och skicka det EXAKTA taggnamnet i tags-parametern. Lämna query tom vid ren tagg-sökning.
- Du kan bedöma kosttyp genom att titta på ingredienserna.
- Du kan filtrera på tillagningstid, antal portioner, ingredienser etc.
- Använd cookCount och lastCookedAt för att svara på frågor om matlagningshistorik.

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

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, conversationId } = await request.json()

        const db = getDb()
        const tags = await getAllTags(db)
        const tagNames = tags.map((t) => t.name)
        const tagSection = tagNames.length > 0
          ? `\n\nTillgängliga taggar i användarens samling: ${tagNames.join(', ')}\nAnvänd EXAKT dessa taggnamn i tags-parametern vid sökning.`
          : ''

        const stream = chat({
          adapter: createOpenaiChat('gpt-4o-mini', env.OPENAI_API_KEY),
          systemPrompts: [SYSTEM_PROMPT + tagSection],
          messages,
          conversationId,
          tools: [searchRecipesTool, getWeeklyMenuTool, addToWeeklyMenuTool],
          agentLoopStrategy: maxIterations(5),
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
