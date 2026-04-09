import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { addToMenu, removeFromMenu, getMenu, getMenuRecipeIds, clearMenu, toggleComplete } from '#/menu/crud'

export const fetchMenu = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getMenu(db)
})

export const addRecipeToMenu = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await addToMenu(db, data.recipeId)
  })

export const removeRecipeFromMenu = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await removeFromMenu(db, data.recipeId)
  })

export const clearAllMenu = createServerFn({ method: 'POST' }).handler(async () => {
  const db = getDb()
  await clearMenu(db)
})

export const fetchMenuRecipeIds = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getMenuRecipeIds(db)
})

export const toggleRecipeComplete = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ recipeId: z.number() }))
  .handler(async ({ data }) => {
    const db = getDb()
    await toggleComplete(db, data.recipeId)
  })
