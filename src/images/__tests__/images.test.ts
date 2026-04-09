import { vi, describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '#/db/schema'

vi.mock('#/images/_r2', () => ({
  putToR2: vi.fn().mockResolvedValue(undefined),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
  keyToUrl: (key: string) => `/api/images/${key}`,
  urlToKey: (url: string) => {
    const prefix = '/api/images/'
    if (!url.startsWith(prefix)) return null
    return url.slice(prefix.length)
  },
}))

vi.mock('#/images/_generate', () => ({
  generateRecipeImage: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
}))

import { createTestDb, createTestRecipe } from '#/test-utils'
import {
  generateImageForRecipe,
  uploadImageForRecipe,
  generateImagePreview,
  uploadImagePreview,
  downloadAndStoreImage,
} from '#/images'
import { putToR2, deleteFromR2 } from '#/images/_r2'
import { generateRecipeImage } from '#/images/_generate'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateImageForRecipe', () => {
  it('deletes old image, stores new one, and updates DB row', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)
    // Manually set an existing imageUrl
    await db
      .update(schema.recipesTable)
      .set({ imageUrl: '/api/images/recipes/old-123.png' })
      .where(eq(schema.recipesTable.id, recipe.id))

    const result = await generateImageForRecipe(db, recipe.id, 'fake-key')

    expect(deleteFromR2).toHaveBeenCalledWith('recipes/old-123.png')
    expect(putToR2).toHaveBeenCalledOnce()
    expect(result.imageUrl).toMatch(/^\/api\/images\/recipes\//)
    expect(generateRecipeImage).toHaveBeenCalledWith(
      recipe.title,
      recipe.description ?? null,
      'fake-key',
    )

    // Verify DB was updated
    const updated = await db
      .select()
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, recipe.id))
    expect(updated[0].imageUrl).toBe(result.imageUrl)
  })

  it('skips deletion when recipe has no image', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)

    await generateImageForRecipe(db, recipe.id, 'fake-key')

    expect(deleteFromR2).not.toHaveBeenCalled()
    expect(putToR2).toHaveBeenCalledOnce()
  })

  it('throws when recipe does not exist', async () => {
    const db = createTestDb()

    await expect(
      generateImageForRecipe(db, 9999, 'fake-key'),
    ).rejects.toThrow('Receptet hittades inte')
  })
})

describe('uploadImageForRecipe', () => {
  it('decodes base64, stores image, and updates DB row', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)

    const result = await uploadImageForRecipe(db, recipe.id, btoa('fake-image'), 'image/jpeg')

    expect(putToR2).toHaveBeenCalledOnce()
    expect(result.imageUrl).toMatch(/^\/api\/images\/recipes\//)
    expect(result.imageUrl).toMatch(/\.jpg$/)

    const updated = await db
      .select()
      .from(schema.recipesTable)
      .where(eq(schema.recipesTable.id, recipe.id))
    expect(updated[0].imageUrl).toBe(result.imageUrl)
  })

  it('deletes old image before storing new one', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)
    await db
      .update(schema.recipesTable)
      .set({ imageUrl: '/api/images/recipes/old.jpg' })
      .where(eq(schema.recipesTable.id, recipe.id))

    await uploadImageForRecipe(db, recipe.id, btoa('fake'), 'image/png')

    expect(deleteFromR2).toHaveBeenCalledWith('recipes/old.jpg')
  })

  it('uses png extension for png mime type', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)

    const result = await uploadImageForRecipe(db, recipe.id, btoa('fake'), 'image/png')

    expect(result.imageUrl).toMatch(/\.png$/)
  })
})

describe('generateImagePreview', () => {
  it('stores image without touching DB', async () => {
    const result = await generateImagePreview('Pasta', 'En god pasta', 'fake-key')

    expect(putToR2).toHaveBeenCalledOnce()
    expect(result.imageUrl).toMatch(/^\/api\/images\/recipes\/preview-/)
    expect(result.imageUrl).toMatch(/\.png$/)
    expect(generateRecipeImage).toHaveBeenCalledWith('Pasta', 'En god pasta', 'fake-key')
  })
})

describe('uploadImagePreview', () => {
  it('stores uploaded image with preview key prefix', async () => {
    const result = await uploadImagePreview(btoa('fake-image'), 'image/jpeg')

    expect(putToR2).toHaveBeenCalledOnce()
    expect(result.imageUrl).toMatch(/^\/api\/images\/recipes\/preview-/)
    expect(result.imageUrl).toMatch(/\.jpg$/)
  })
})

describe('downloadAndStoreImage', () => {
  it('downloads and stores image, returns URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'Content-Type': 'image/png' }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await downloadAndStoreImage('https://example.com/photo.png')

    expect(result).toMatch(/^\/api\/images\/recipes\/imported-/)
    expect(result).toMatch(/\.png$/)
    expect(putToR2).toHaveBeenCalledOnce()

    vi.unstubAllGlobals()
  })

  it('returns null when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await downloadAndStoreImage('https://example.com/broken.jpg')

    expect(result).toBeNull()
    expect(putToR2).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await downloadAndStoreImage('https://example.com/down.jpg')

    expect(result).toBeNull()

    vi.unstubAllGlobals()
  })
})

describe('deleteOldImage error handling', () => {
  it('logs warning instead of throwing when deletion fails', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db)
    await db
      .update(schema.recipesTable)
      .set({ imageUrl: '/api/images/recipes/fail.png' })
      .where(eq(schema.recipesTable.id, recipe.id))

    vi.mocked(deleteFromR2).mockRejectedValueOnce(new Error('R2 error'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Should not throw despite deletion failure
    const result = await generateImageForRecipe(db, recipe.id, 'fake-key')

    expect(warnSpy).toHaveBeenCalledWith(
      '[images] Failed to delete old image:',
      'recipes/fail.png',
      expect.any(Error),
    )
    expect(result.imageUrl).toBeTruthy()

    warnSpy.mockRestore()
  })
})
