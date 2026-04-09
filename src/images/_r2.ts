import { env } from 'cloudflare:workers'

const IMAGE_PATH_PREFIX = '/api/images/'

export const keyToUrl = (key: string): string => `${IMAGE_PATH_PREFIX}${key}`

export const urlToKey = (url: string): string | null => {
  if (!url.startsWith(IMAGE_PATH_PREFIX)) return null
  return url.slice(IMAGE_PATH_PREFIX.length)
}

export const putToR2 = async (
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> => {
  await env.R2.put(key, data, { httpMetadata: { contentType } })
}

export const deleteFromR2 = async (key: string): Promise<void> => {
  await env.R2.delete(key)
}
