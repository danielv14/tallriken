import { embed } from '#/vector/embed'

const MIN_SIMILARITY_SCORE = 0.2

type FindSimilarOptions = {
  query: string
  topK?: number
  filter?: VectorizeVectorMetadataFilter
}

export type FindSimilarResult = {
  recipeId: number
  score: number
}

export type VectorSearch = ReturnType<typeof createVectorSearch>

export const createVectorSearch = (vectorize: VectorizeIndex, apiKey: string) => ({
  findSimilar: async ({
    query,
    topK = 10,
    filter,
  }: FindSimilarOptions): Promise<FindSimilarResult[]> => {
    const queryVector = await embed(query, apiKey)

    const results = await vectorize.query(queryVector, {
      topK,
      filter,
      returnMetadata: 'none',
    })

    return results.matches
      .filter((match) => match.score >= MIN_SIMILARITY_SCORE)
      .map((match) => ({
        recipeId: Number(match.id),
        score: match.score,
      }))
  },

  upsert: async (
    recipeId: number,
    vector: number[],
    metadata: Record<string, string | number | string[]>,
  ): Promise<void> => {
    await vectorize.upsert([
      {
        id: String(recipeId),
        values: vector,
        metadata,
      },
    ])
  },

  remove: async (recipeId: number): Promise<void> => {
    await vectorize.deleteByIds([String(recipeId)])
  },
})
