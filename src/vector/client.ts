import { env } from 'cloudflare:workers'
import { createVectorSearch } from '#/vector/search'
import { createRecipeIndex } from '#/vector/recipe-index'
import { getDb } from '#/db/client'

export const getVectorSearch = () => {
  return createVectorSearch(env.VECTORIZE, env.OPENAI_API_KEY)
}

export const getRecipeIndex = () =>
  createRecipeIndex(getDb(), getVectorSearch(), env.OPENAI_API_KEY)
