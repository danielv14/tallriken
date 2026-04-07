/**
 * Strips noise from HTML to extract the meaningful text content.
 * Removes scripts, styles, navigation, ads, and other non-content elements,
 * then converts remaining HTML to plain text.
 */
export const cleanHtmlForExtraction = (html: string): string => {
  let cleaned = html

  // Remove elements that never contain recipe content
  const stripTags = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    'iframe', 'noscript', 'svg', 'form',
  ]
  for (const tag of stripTags) {
    cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '')
  }

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // Remove common ad/cookie/social divs by class/id patterns
  cleaned = cleaned.replace(/<div[^>]*(?:class|id)=["'][^"']*(?:cookie|consent|banner|popup|modal|newsletter|social|share|sidebar|widget|ad-|ads-|advertisement)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')

  // Replace block elements with newlines for readability
  cleaned = cleaned.replace(/<\/(?:p|div|li|tr|h[1-6]|br|section|article)>/gi, '\n')
  cleaned = cleaned.replace(/<(?:br|hr)\s*\/?>/gi, '\n')

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')

  // Collapse whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.replace(/\n\s*\n+/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}
