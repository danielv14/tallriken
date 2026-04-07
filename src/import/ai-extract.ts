import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { recipeDraftSchema, type RecipeDraft } from '#/import/schema'

const buildSystemPrompt = (tagNames: string[]) => {
  const tagSection = tagNames.length > 0
    ? `\n\nTillgängliga taggar att välja bland: ${tagNames.join(', ')}\nVälj de taggar som passar receptet bäst och returnera dem i fältet "suggestedTagNames". Välj bara taggar från listan ovan.`
    : ''

  return `Du är en receptextraherare. Du får HTML-innehåll från en receptsajt och ska extrahera receptet till ett strukturerat format på svenska.

Regler:
- Extrahera titel, beskrivning, ingredienser, steg, tillagningstid och portioner
- Ingredienser ska vara en lista med strängar, en per ingrediens
- Steg ska vara en lista med strängar, ett per steg
- Tillagningstid i minuter som heltal
- Portioner som heltal
- Om informationen saknas, utelämna fältet
- Svara alltid på svenska${tagSection}`
}

export const extractRecipeWithAi = async (
  html: string,
  tagNames: string[],
  apiKey: string,
): Promise<RecipeDraft | null> => {
  const client = new OpenAI({ apiKey })

  // Begränsa HTML-storleken för att undvika att spränga token-gränsen
  const trimmedHtml = html.slice(0, 50000)

  const completion = await client.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(tagNames) },
      { role: 'user', content: `Extrahera receptet från denna HTML:\n\n${trimmedHtml}` },
    ],
    response_format: zodResponseFormat(recipeDraftSchema, 'recipe_draft'),
  })

  const message = completion.choices[0]?.message
  if (!message?.parsed) return null

  return message.parsed
}
