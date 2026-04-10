import { env } from 'cloudflare:workers'
import { createVectorSearch } from '#/vector/search'

export const getVectorSearch = () => {
  return createVectorSearch(env.VECTORIZE, env.OPENAI_API_KEY)
}
