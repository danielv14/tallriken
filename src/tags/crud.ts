import { asc, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '#/db/schema'

type Database = BetterSQLite3Database<typeof schema> | DrizzleD1Database<typeof schema>

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
