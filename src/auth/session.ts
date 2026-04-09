import crypto from 'node:crypto'

export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60 // 30 days

export const createSessionToken = (secret: string): string => {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000
  const payload = `${expiresAt}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

export const validateSessionToken = (token: string, secret: string): boolean => {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payload, signature] = parts
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  if (signature !== expectedSignature) return false

  const expiresAt = parseInt(payload, 10)
  if (isNaN(expiresAt)) return false

  return Date.now() < expiresAt
}

export const verifyPassword = (input: string, expected: string): boolean => {
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)

  if (inputBuffer.length !== expectedBuffer.length) return false

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer)
}
