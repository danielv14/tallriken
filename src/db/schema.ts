import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const tagsTable = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const recipesTable = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  ingredients: text('ingredients', { mode: 'json' }).notNull().$type<{ group: string | null; items: string[] }[]>(),
  steps: text('steps', { mode: 'json' }).$type<string[]>(),
  cookingTimeMinutes: integer('cooking_time_minutes'),
  servings: integer('servings'),
  sourceUrl: text('source_url'),
  imageUrl: text('image_url'),
  lastCookedAt: integer('last_cooked_at', { mode: 'timestamp' }),
  cookCount: integer('cook_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const recipeTagsTable = sqliteTable('recipe_tags', {
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipesTable.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tagsTable.id, { onDelete: 'cascade' }),
})

export const shoppingListsTable = sqliteTable('shopping_lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const weeklyMenuItemsTable = sqliteTable('weekly_menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipesTable.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})
