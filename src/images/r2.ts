import { env } from 'cloudflare:workers'

export const uploadImageToR2 = async (key: string, data: ArrayBuffer, contentType: string) => {
  await env.R2.put(key, data, {
    httpMetadata: { contentType },
  })
  return key
}

export const getImageUrl = (key: string): string => {
  return `/api/images/${key}`
}

export const deleteImageFromR2 = async (key: string) => {
  await env.R2.delete(key)
}
