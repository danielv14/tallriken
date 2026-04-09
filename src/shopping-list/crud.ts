import { desc } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'

export const saveShoppingList = async (db: Database, content: string) => {
  await db.delete(schema.shoppingListsTable)
  await db.insert(schema.shoppingListsTable).values({ content })
}

export const getShoppingList = async (db: Database): Promise<string | null> => {
  const rows = await db
    .select({ content: schema.shoppingListsTable.content })
    .from(schema.shoppingListsTable)
    .orderBy(desc(schema.shoppingListsTable.id))
    .limit(1)

  return rows.length > 0 ? rows[0].content : null
}
