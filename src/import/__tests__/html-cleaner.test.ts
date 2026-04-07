import { describe, it, expect } from 'vitest'
import { cleanHtmlForExtraction } from '#/import/html-cleaner'

describe('cleanHtmlForExtraction', () => {
  it('removes script and style tags with their content', () => {
    const html = '<p>Recept</p><script>alert("hi")</script><style>.foo{}</style><p>Ingredienser</p>'
    const result = cleanHtmlForExtraction(html)
    expect(result).not.toContain('alert')
    expect(result).not.toContain('.foo')
    expect(result).toContain('Recept')
    expect(result).toContain('Ingredienser')
  })

  it('removes nav, header, footer, aside elements', () => {
    const html = '<nav><a href="/">Hem</a></nav><main><p>400g pasta</p></main><footer>Copyright</footer>'
    const result = cleanHtmlForExtraction(html)
    expect(result).not.toContain('Hem')
    expect(result).not.toContain('Copyright')
    expect(result).toContain('400g pasta')
  })

  it('converts block elements to newlines', () => {
    const html = '<p>Steg 1</p><p>Steg 2</p>'
    const result = cleanHtmlForExtraction(html)
    expect(result).toContain('Steg 1')
    expect(result).toContain('Steg 2')
  })

  it('decodes HTML entities', () => {
    const html = '<p>Salt &amp; peppar</p>'
    const result = cleanHtmlForExtraction(html)
    expect(result).toContain('Salt & peppar')
  })

  it('collapses excessive whitespace', () => {
    const html = '<p>  Mycket   mellanrum  </p>'
    const result = cleanHtmlForExtraction(html)
    expect(result).not.toContain('  ')
  })
})
