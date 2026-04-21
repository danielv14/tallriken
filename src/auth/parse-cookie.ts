/**
 * Parse a named cookie value from a raw Cookie header string.
 *
 * Used in raw route handlers where `getCookie` (from `@tanstack/react-start/server`)
 * isn't available. Prefer `authMiddleware` for server functions.
 */
export const parseCookie = (cookieHeader: string, name: string): string | undefined => {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match?.[1]
}
