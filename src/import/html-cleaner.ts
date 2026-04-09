export const cleanHtmlForExtraction = (html: string): string => {
  let cleaned = html

  const stripTags = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    'iframe', 'noscript', 'svg', 'form',
  ]
  for (const tag of stripTags) {
    cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '')
  }

  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  cleaned = cleaned.replace(/<div[^>]*(?:class|id)=["'][^"']*(?:cookie|consent|banner|popup|modal|newsletter|social|share|sidebar|widget|ad-|ads-|advertisement)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')

  cleaned = cleaned.replace(/<\/(?:p|div|li|tr|h[1-6]|br|section|article)>/gi, '\n')
  cleaned = cleaned.replace(/<(?:br|hr)\s*\/?>/gi, '\n')

  cleaned = cleaned.replace(/<[^>]+>/g, ' ')

  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')

  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.replace(/\n\s*\n+/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}
