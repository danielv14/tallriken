import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { env } from 'cloudflare:workers'
import { searchRecipesTool } from '#/chat/tools'

const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

Regler:
- Svara alltid på svenska
- Använd verktyget search_recipes för att söka bland användarens sparade recept
- Basera dina förslag på användarens egna receptsamling
- Om du inte hittar något passande, säg det och föreslå alternativ
- Var kortfattad och tydlig
- Formatera inköpslistor och veckomenyer på ett lättläst sätt`

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
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
