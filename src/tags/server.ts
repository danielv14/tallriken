import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createTag, getAllTags, deleteTag } from '#/tags/crud'
import { authMiddleware } from '#/auth/middleware'
import { getRecipeIndex } from '#/vector/client'
import { createSyncedMutations } from '#/vector/with-vector-sync'

const getMutations = () => createSyncedMutations(getDb(), getRecipeIndex())

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
  .handler(async ({ data }) => getMutations().renameTag(data.id, data.name))

export const removeTag = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteTag(db, data.id)
  })
