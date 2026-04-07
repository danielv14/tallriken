export const SESSION_COOKIE_NAME = 'tallriken_session'

export const serializeSessionCookie = (token: string, maxAgeSeconds: number) => {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=${maxAgeSeconds}`
}

export const serializeBlankSessionCookie = () => {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0`
}
