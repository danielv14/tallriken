import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { createTag, getAllTags, renameTag, deleteTag } from '#/tags/crud'

export const fetchAllTags = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getAllTags(db)
})

export const addTag = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    return createTag(db, data.name)
  })

export const updateTagName = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number(), name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb()
    return renameTag(db, data.id, data.name)
  })

export const removeTag = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await deleteTag(db, data.id)
  })
