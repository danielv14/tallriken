import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type * as schema from '#/db/schema'

export type Database = BaseSQLiteDatabase<any, any, typeof schema>
