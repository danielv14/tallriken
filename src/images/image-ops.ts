import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { uploadImageToR2, getImageUrl, deleteImageFromR2 } from '#/images/r2'
import { generateRecipeImage } from '#/images/generate'

const decodeBase64 = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const deleteOldImage = async (imageUrl: string | null) => {
  if (!imageUrl) return
  const oldKey = imageUrl.replace('/api/images/', '')
  try {
    await deleteImageFromR2(oldKey)
  } catch {
    // Ignore deletion errors
  }
}

const storeImage = async (key: string, data: ArrayBuffer, contentType: string): Promise<string> => {
  await uploadImageToR2(key, data, contentType)
  return getImageUrl(key)
}

const updateRecipeImageUrl = async (db: Database, recipeId: number, imageUrl: string) => {
  await db
    .update(schema.recipesTable)
    .set({ imageUrl })
    .where(eq(schema.recipesTable.id, recipeId))
}

const getRecipeOrThrow = async (db: Database, recipeId: number) => {
  const recipes = await db
    .select()
    .from(schema.recipesTable)
    .where(eq(schema.recipesTable.id, recipeId))

  if (recipes.length === 0) {
    throw new Error('Receptet hittades inte')
  }

  return recipes[0]
}

export const generateAndStore = async (
  db: Database,
  recipeId: number,
  apiKey: string,
): Promise<{ imageUrl: string }> => {
  const recipe = await getRecipeOrThrow(db, recipeId)
  await deleteOldImage(recipe.imageUrl)

  const imageData = await generateRecipeImage(recipe.title, recipe.description, apiKey)
  const key = `recipes/${recipeId}-${Date.now()}.png`
  const imageUrl = await storeImage(key, imageData, 'image/png')

  await updateRecipeImageUrl(db, recipeId, imageUrl)
  return { imageUrl }
}

export const generatePreview = async (
  title: string,
  description: string | null,
  apiKey: string,
): Promise<{ imageUrl: string }> => {
  const imageData = await generateRecipeImage(title, description, apiKey)
  const key = `recipes/preview-${Date.now()}.png`
  const imageUrl = await storeImage(key, imageData, 'image/png')
  return { imageUrl }
}

export const uploadAndStore = async (
  base64: string,
  mimeType: string,
): Promise<{ imageUrl: string }> => {
  const data = decodeBase64(base64)
  const extension = mimeType.includes('png') ? 'png' : 'jpg'
  const key = `recipes/uploaded-${Date.now()}.${extension}`
  const imageUrl = await storeImage(key, data, mimeType)
  return { imageUrl }
}

export const uploadForRecipe = async (
  db: Database,
  recipeId: number,
  base64: string,
  mimeType: string,
): Promise<{ imageUrl: string }> => {
  const data = decodeBase64(base64)
  const extension = mimeType.includes('png') ? 'png' : 'jpg'
  const key = `recipes/${recipeId}-uploaded-${Date.now()}.${extension}`
  const imageUrl = await storeImage(key, data, mimeType)

  await updateRecipeImageUrl(db, recipeId, imageUrl)
  return { imageUrl }
}

export const downloadAndStore = async (externalUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(externalUrl)
    if (!response.ok) return null

    const contentType = response.headers.get('Content-Type') ?? 'image/jpeg'
    const data = await response.arrayBuffer()

    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const key = `recipes/imported-${Date.now()}.${extension}`
    return await storeImage(key, data, contentType)
  } catch {
    return null
  }
}
