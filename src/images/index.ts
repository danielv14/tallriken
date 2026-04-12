import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'
import type { Database } from '#/db/types'
import { putToR2, deleteFromR2, keyToUrl, urlToKey } from '#/images/_r2'
import { generateRecipeImage } from '#/images/_generate'
import { validatePublicUrl } from '#/utils/url-validation'

const makeKey = {
  forRecipe: (recipeId: number, ext: string) =>
    `recipes/${recipeId}-${Date.now()}.${ext}`,
  forPreview: (ext: string) => `recipes/preview-${Date.now()}.${ext}`,
  forImport: (ext: string) => `recipes/imported-${Date.now()}.${ext}`,
}

const extFromMime = (mimeType: string): string =>
  mimeType.includes('png') ? 'png' : 'jpg'

const decodeBase64 = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const deleteOldImage = async (existingUrl: string | null): Promise<void> => {
  if (!existingUrl) return
  const key = urlToKey(existingUrl)
  if (!key) return
  try {
    await deleteFromR2(key)
  } catch (error) {
    console.warn('[images] Failed to delete old image:', key, error)
  }
}

const updateRecipeImageUrl = async (
  db: Database,
  recipeId: number,
  imageUrl: string,
): Promise<void> => {
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

const storeRecipeImage = async (
  db: Database,
  recipeId: number,
  data: ArrayBuffer,
  mimeType: string,
  ext: string,
): Promise<{ imageUrl: string }> => {
  const recipe = await getRecipeOrThrow(db, recipeId)
  await deleteOldImage(recipe.imageUrl)
  const key = makeKey.forRecipe(recipeId, ext)
  await putToR2(key, data, mimeType)
  const imageUrl = keyToUrl(key)
  await updateRecipeImageUrl(db, recipeId, imageUrl)
  return { imageUrl }
}

export const generateImageForRecipe = async (
  db: Database,
  recipeId: number,
  apiKey: string,
): Promise<{ imageUrl: string }> => {
  const recipe = await getRecipeOrThrow(db, recipeId)
  const imageData = await generateRecipeImage(recipe.title, recipe.description, apiKey)
  return storeRecipeImage(db, recipeId, imageData, 'image/png', 'png')
}

export const uploadImageForRecipe = async (
  db: Database,
  recipeId: number,
  base64: string,
  mimeType: string,
): Promise<{ imageUrl: string }> => {
  const data = decodeBase64(base64)
  return storeRecipeImage(db, recipeId, data, mimeType, extFromMime(mimeType))
}

export const generateImagePreview = async (
  title: string,
  description: string | null,
  apiKey: string,
): Promise<{ imageUrl: string }> => {
  const imageData = await generateRecipeImage(title, description, apiKey)
  const key = makeKey.forPreview('png')
  await putToR2(key, imageData, 'image/png')
  return { imageUrl: keyToUrl(key) }
}

export const uploadImagePreview = async (
  base64: string,
  mimeType: string,
): Promise<{ imageUrl: string }> => {
  const data = decodeBase64(base64)
  const key = makeKey.forPreview(extFromMime(mimeType))
  await putToR2(key, data, mimeType)
  return { imageUrl: keyToUrl(key) }
}

export const downloadAndStoreImage = async (
  externalUrl: string,
): Promise<string | null> => {
  try {
    validatePublicUrl(externalUrl)

    const response = await fetch(externalUrl)
    if (!response.ok) return null

    const contentType = response.headers.get('Content-Type') ?? 'image/jpeg'
    const data = await response.arrayBuffer()
    const key = makeKey.forImport(extFromMime(contentType))
    await putToR2(key, data, contentType)
    return keyToUrl(key)
  } catch {
    return null
  }
}
