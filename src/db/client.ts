import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import * as schema from '#/db/schema'

export const getDb = () => {
  return drizzle(env.DB, { schema })
}
