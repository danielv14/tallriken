import { asc, eq, inArray } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

export const getTagNamesByIds = async (db: Database, tagIds: number[]): Promise<string[]> => {
  if (tagIds.length === 0) return []
  const tags = await db
    .select({ name: schema.tagsTable.name })
    .from(schema.tagsTable)
    .where(inArray(schema.tagsTable.id, tagIds))
  return tags.map((t) => t.name)
}

export const createTag = async (db: Database, name: string) => {
  const result = await db
    .insert(schema.tagsTable)
    .values({ name, createdAt: new Date() })
    .returning()

  return result[0]
}

export const getAllTags = async (db: Database) => {
  return db.select().from(schema.tagsTable).orderBy(asc(schema.tagsTable.name))
}

export const renameTag = async (db: Database, id: number, newName: string) => {
  const result = await db
    .update(schema.tagsTable)
    .set({ name: newName })
    .where(eq(schema.tagsTable.id, id))
    .returning()

  return result[0]
}

export const deleteTag = async (db: Database, id: number) => {
  await db.delete(schema.tagsTable).where(eq(schema.tagsTable.id, id))
}
