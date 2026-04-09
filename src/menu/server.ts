import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { env } from 'cloudflare:workers'
import { addToMenu, removeFromMenu, getMenu, getMenuRecipeIds, clearMenu, toggleComplete } from '#/menu/crud'
import { recordCooked, undoCooked } from '#/recipes/cooking-stats'
import { saveShoppingList, getShoppingList } from '#/shopping-list/crud'
import { generateShoppingList } from '#/shopping-list/generate'
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
    const result = await toggleComplete(db, data.recipeId)

    if (result) {
      if (result.completed) {
        await recordCooked(db, result.recipeId)
      } else {
        await undoCooked(db, result.recipeId)
      }
    }
  })

export const generateAndSaveShoppingList = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  const menu = await getMenu(db)

  if (menu.length === 0) {
    throw new Error('Inga recept i menyn')
  }

  const content = await generateShoppingList(
    menu.map((item) => ({
      title: item.recipe.title,
      ingredients: item.recipe.ingredients,
    })),
    env.OPENAI_API_KEY,
  )
  await saveShoppingList(db, content)
  return content
})

export const fetchShoppingList = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
  const db = getDb()
  return getShoppingList(db)
})
