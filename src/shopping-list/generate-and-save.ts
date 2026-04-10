import type { Database } from '#/db/types'
import { getMenu } from '#/menu/crud'
import { saveShoppingList } from '#/shopping-list/crud'
import { generateShoppingList } from '#/shopping-list/generate'

export const generateAndSaveShoppingList = async (db: Database, apiKey: string): Promise<string> => {
  const menu = await getMenu(db)

  if (menu.length === 0) {
    throw new Error('Inga recept i menyn')
  }

  const content = await generateShoppingList(
    menu.map((item) => ({ title: item.recipe.title, ingredients: item.recipe.ingredients })),
    apiKey,
  )
  await saveShoppingList(db, content)
  return content
}
