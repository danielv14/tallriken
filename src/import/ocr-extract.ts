import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { recipeDraftSchema, type RecipeDraft } from '#/import/schema'

type ImageInput = {
  base64: string
  mimeType: string
}

const buildSystemPrompt = (tagNames: string[]) => {
  const tagSection = tagNames.length > 0
    ? `\n\nTillgängliga taggar att välja bland: ${tagNames.join(', ')}\nVälj de taggar som passar receptet bäst och returnera dem i fältet "suggestedTagNames". Välj bara taggar från listan ovan.`
    : ''

  return `Du är en receptextraherare. Du får en eller flera bilder av en kokbokssida och ska extrahera receptet till ett strukturerat format på svenska.

Regler:
- Extrahera ALLA ingredienser, inte bara några. Var noggrann.
- Ingredienser ska grupperas om receptet har underrubriker (t.ex. "Deg", "Fyllning", "Sås"). Varje grupp har ett "group"-fält (gruppnamn eller null om ingen grupp) och "items" (lista med ingredienser).
- Om receptet inte har grupperade ingredienser, använd en enda grupp med group: null.
- Extrahera ALLA tillagningssteg i ordning. Var noggrann.
- Steg ska vara en lista med strängar, ett per steg
- Tillagningstid i minuter som heltal
- Portioner som heltal
- Om flera bilder skickas tillhör de samma recept (t.ex. ett uppslag i en kokbok)
- Om informationen saknas, sätt fältet till null
- Svara alltid på svenska${tagSection}`
}

export const extractRecipeFromImages = async (
  images: ImageInput[],
  tagNames: string[],
  apiKey: string,
): Promise<RecipeDraft | null> => {
  const client = new OpenAI({ apiKey })

  const imageContent = images.map((img) => ({
    type: 'image_url' as const,
    image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
  }))

  const completion = await client.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(tagNames) },
      {
        role: 'user',
        content: [
          { type: 'text' as const, text: 'Extrahera receptet från dessa bilder:' },
          ...imageContent,
        ],
      },
    ],
    response_format: zodResponseFormat(recipeDraftSchema, 'recipe_draft'),
  })

  const message = completion.choices[0].message
  if (!message?.parsed) return null

  return message.parsed
}
