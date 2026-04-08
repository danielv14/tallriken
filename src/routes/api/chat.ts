import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse, maxIterations } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'
import { searchRecipesTool } from '#/chat/tools'

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

Regler:
- Svara alltid på svenska
- Använd verktyget search_recipes för att söka bland användarens sparade recept
- Varje recept i sökresultatet har ett "url"-fält. Använd det exakt som det är för att skapa markdown-länkar. Exempel: om ett recept har url "/recipes/5" och titel "Pasta Carbonara", skriv [Pasta Carbonara](/recipes/5)
- Ge en kort beskrivning av receptet men länka till det istället för att skriva ut hela receptet, om inte användaren explicit ber om detaljer
- Om du inte hittar något passande, säg det och föreslå alternativ
- Var kortfattad och tydlig
- Formatera inköpslistor och veckomenyer på ett lättläst sätt med markdown
- Basera dina förslag på användarens egna receptsamling
- Om meddelandet börjar med [KONTEXT: ...] innehåller det information om vilken sida användaren befinner sig på. Använd den informationen för att förstå vad användaren syftar på med "det här receptet" eller liknande.`

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, conversationId } = await request.json()

        const stream = chat({
          adapter: openaiText('gpt-4o-mini', {
            apiKey: env.OPENAI_API_KEY,
          }),
          system: SYSTEM_PROMPT,
          messages,
          conversationId,
          tools: [searchRecipesTool],
          agentLoopStrategy: maxIterations(5),
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
