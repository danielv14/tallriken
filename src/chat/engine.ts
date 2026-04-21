import { chat, maxIterations } from '@tanstack/ai'
import type { StreamChunk } from '@tanstack/ai'
import { getAllRecipes } from '#/recipes/crud'
import { buildRecipeIndex } from '#/chat/recipe-index'
import { createTools } from '#/chat/tools'
import type { ChatEngineDeps, ChatInput } from '#/chat/types'

export const SYSTEM_PROMPT = `Du är Tallrikens receptassistent. Du hjälper användaren att hitta recept, planera veckomenyer, skapa inköpslistor och skala recept.

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

export type ChatEngine = {
  chat: (input: ChatInput) => Promise<AsyncIterable<StreamChunk>>
}

export const createChatEngine = (deps: ChatEngineDeps): ChatEngine => ({
  chat: async (input) => {
    const recipes = await getAllRecipes(deps.db)
    const recipeIndex = buildRecipeIndex(recipes)
    const tools = createTools(deps.db)

    return chat({
      adapter: deps.adapter,
      systemPrompts: [SYSTEM_PROMPT + `\n\nRECEPTSAMLING (${recipes.length} recept):\n\n` + recipeIndex],
      messages: input.messages,
      conversationId: input.conversationId,
      tools,
      agentLoopStrategy: maxIterations(12),
    })
  },
})
