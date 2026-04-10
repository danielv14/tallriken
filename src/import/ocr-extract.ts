import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { recipeDraftSchema, type RecipeDraft } from '#/import/schema'
import { buildExtractionPrompt } from '#/import/prompts'

type ImageInput = {
  base64: string
  mimeType: string
}

const buildSystemPrompt = (tagNames: string[]) =>
  buildExtractionPrompt(
    'Du är en receptextraherare. Du får en eller flera bilder av en kokbokssida och ska extrahera receptet till ett strukturerat format på svenska.\n\nOm flera bilder skickas tillhör de samma recept (t.ex. ett uppslag i en kokbok).',
    tagNames,
  )

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
