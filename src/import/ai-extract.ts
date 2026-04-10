import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { recipeDraftSchema, type RecipeDraft } from '#/import/schema'
import { cleanHtmlForExtraction } from '#/import/html-cleaner'
import { buildExtractionPrompt } from '#/import/prompts'

const buildSystemPrompt = (tagNames: string[]) =>
  buildExtractionPrompt(
    'Du är en receptextraherare. Du får textinnehåll extraherat från en receptsajt och ska extrahera receptet till ett strukturerat format på svenska.',
    tagNames,
  )

export const extractRecipeWithAi = async (
  html: string,
  tagNames: string[],
  apiKey: string,
): Promise<RecipeDraft | null> => {
  const client = new OpenAI({ apiKey })

  const cleanedText = cleanHtmlForExtraction(html)

  // Begränsa storleken för att undvika att spränga token-gränsen
  const trimmedText = cleanedText.slice(0, 30000)

  const completion = await client.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(tagNames) },
      { role: 'user', content: `Extrahera receptet från denna text:\n\n${trimmedText}` },
    ],
    response_format: zodResponseFormat(recipeDraftSchema, 'recipe_draft'),
  })

  const message = completion.choices[0].message
  if (!message?.parsed) return null

  return message.parsed
}
