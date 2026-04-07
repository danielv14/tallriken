import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '#/db/schema'
import { createTag, getAllTags, renameTag, deleteTag } from '#/tags/crud'

const createTestDb = () => {
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `)
  return drizzle(sqlite, { schema })
}

describe('createTag', () => {
  it('creates a tag and returns it with an id', async () => {
    const db = createTestDb()

    const tag = await createTag(db, 'Snabblagat')

    expect(tag.id).toBeTruthy()
    expect(tag.name).toBe('Snabblagat')
  })

  it('throws when creating a tag with a duplicate name', async () => {
    const db = createTestDb()
    await createTag(db, 'Snabblagat')

    await expect(createTag(db, 'Snabblagat')).rejects.toThrow()
  })
})

describe('getAllTags', () => {
  it('returns all tags sorted by name', async () => {
    const db = createTestDb()
    await createTag(db, 'Vegetariskt')
    await createTag(db, 'Barnvänligt')
    await createTag(db, 'Snabblagat')

    const tags = await getAllTags(db)

    expect(tags.map((t) => t.name)).toEqual(['Barnvänligt', 'Snabblagat', 'Vegetariskt'])
  })

  it('returns empty array when no tags exist', async () => {
    const db = createTestDb()

    const tags = await getAllTags(db)

    expect(tags).toEqual([])
  })
})

describe('renameTag', () => {
  it('renames a tag', async () => {
    const db = createTestDb()
    const tag = await createTag(db, 'Snabblagat')

    const renamed = await renameTag(db, tag.id, 'Under 30 min')

    expect(renamed.name).toBe('Under 30 min')
    expect(renamed.id).toBe(tag.id)
  })

  it('throws when renaming to a name that already exists', async () => {
    const db = createTestDb()
    await createTag(db, 'Snabblagat')
    const tag2 = await createTag(db, 'Vegetariskt')

    await expect(renameTag(db, tag2.id, 'Snabblagat')).rejects.toThrow()
  })
})

describe('deleteTag', () => {
  it('removes a tag so it no longer appears in getAllTags', async () => {
    const db = createTestDb()
    const tag = await createTag(db, 'Snabblagat')
    await createTag(db, 'Vegetariskt')

    await deleteTag(db, tag.id)
    const tags = await getAllTags(db)

    expect(tags.map((t) => t.name)).toEqual(['Vegetariskt'])
  })
})
