import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '#/db/client'
import { env } from 'cloudflare:workers'
import { addToMenu, removeFromMenu, getMenu, getMenuRecipeIds, clearMenu, toggleComplete, saveShoppingList, getShoppingList } from '#/menu/crud'
import { generateShoppingList } from '#/menu/generate-shopping-list'

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

export const generateAndSaveShoppingList = createServerFn({ method: 'POST' }).handler(async () => {
  const db = getDb()
  const menu = await getMenu(db)

  if (menu.length === 0) {
    throw new Error('Inga recept i menyn')
  }

  const recipes = menu.map((item) => ({
    title: item.recipe.title,
    ingredients: [] as Array<{ group: string | null; items: string[] }>,
  }))

  // getMenu doesn't return ingredients, so fetch full recipes
  const { getAllRecipes } = await import('#/recipes/crud')
  const allRecipes = await getAllRecipes(db)
  const recipeMap = new Map(allRecipes.map((r) => [r.id, r]))

  const recipesWithIngredients = menu.map((item) => {
    const fullRecipe = recipeMap.get(item.recipe.id)
    return {
      title: item.recipe.title,
      ingredients: fullRecipe?.ingredients ?? [],
    }
  })

  const content = await generateShoppingList(recipesWithIngredients, env.OPENAI_API_KEY)
  await saveShoppingList(db, content)
  return content
})

export const fetchShoppingList = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  return getShoppingList(db)
})
