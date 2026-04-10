const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
]

const BLOCKED_HOSTNAMES = ['localhost', '[::1]']

export const validatePublicUrl = (url: string): void => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked URL scheme: ${parsed.protocol}`)
  }

  const hostname = parsed.hostname

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`)
  }

  if (hostname === '::1') {
    throw new Error(`Blocked hostname: ${hostname}`)
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Blocked private IP address: ${hostname}`)
    }
  }
}
