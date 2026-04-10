import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { env } from 'cloudflare:workers'
import { addToMenu, removeFromMenu, getMenu, getMenuRecipeIds, clearMenu } from '#/menu/crud'
import { toggleRecipeComplete as toggleRecipeCompleteHandler } from '#/menu/toggle-complete'
import { generateAndSaveShoppingList as generateAndSaveShoppingListHandler } from '#/shopping-list/generate-and-save'
import { getShoppingList } from '#/shopping-list/crud'
import { authMiddleware } from '#/auth/middleware'

export const fetchMenu = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getMenu(db)
})

export const addRecipeToMenu = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await addToMenu(db, data.recipeId)
  })

export const removeRecipeFromMenu = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await removeFromMenu(db, data.recipeId)
  })

export const clearAllMenu = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  await clearMenu(db)
})

export const fetchMenuRecipeIds = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getMenuRecipeIds(db)
})

export const toggleRecipeComplete = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await toggleRecipeCompleteHandler(db, data.recipeId)
  })

export const generateAndSaveShoppingList = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    return generateAndSaveShoppingListHandler(db, env.OPENAI_API_KEY)
  })

export const fetchShoppingList = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getShoppingList(db)
})
