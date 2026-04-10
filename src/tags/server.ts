import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from 'cloudflare:workers'
import { getDb } from '#/db/client'
import { createTag, getAllTags, renameTag, deleteTag } from '#/tags/crud'
import { authMiddleware } from '#/auth/middleware'
import { getVectorSearch } from '#/vector/client'
import { createRecipeIndex } from '#/vector/recipe-index'

export const fetchAllTags = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getAllTags(db)
})

export const addTag = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    return createTag(db, data.name)
  })

export const updateTagName = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number(), name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    const tag = await renameTag(db, data.id, data.name)

    const index = createRecipeIndex(db, getVectorSearch(), env.OPENAI_API_KEY)
    await index.onTagRenamed(data.id)

    return tag
  })

export const removeTag = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteTag(db, data.id)
  })
