import OpenAI from 'openai'

type EmbeddingInput = {
  title: string
  tags: string[]
  description: string | null
  cookingTimeMinutes: number | null
}

export const buildEmbeddingText = (recipe: EmbeddingInput): string => {
  const parts = [recipe.title]

  if (recipe.tags.length > 0) {
    parts.push(recipe.tags.join(', '))
  }

  if (recipe.description) {
    parts.push(recipe.description)
  }

  if (recipe.cookingTimeMinutes != null) {
    parts.push(`${recipe.cookingTimeMinutes} min`)
  }

  return parts.join(' | ')
}

export const embed = async (text: string, apiKey: string): Promise<number[]> => {
  const openai = new OpenAI({ apiKey })

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}
