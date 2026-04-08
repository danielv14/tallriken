import OpenAI from 'openai'

export const generateRecipeImage = async (
  title: string,
  description: string | null,
  apiKey: string,
): Promise<ArrayBuffer> => {
  const client = new OpenAI({ apiKey })

  const prompt = `Professionellt matfoto uppifrån av: ${title}${description ? `. ${description}` : ''}. Naturligt ljus, vit tallrik, minimalistisk styling, aptitligt.`

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  })

  const imageUrl = response.data[0]?.url
  if (!imageUrl) {
    throw new Error('Kunde inte generera bild')
  }

  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Kunde inte hämta genererad bild')
  }

  return imageResponse.arrayBuffer()
}
