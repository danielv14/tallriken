import { describe, it, expect, vi, beforeEach } from 'vitest'

const parseMock = vi.fn()

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        parse: parseMock,
      },
    },
  })),
}))

// Must import after mock setup
const { extractRecipeFromImages } = await import('#/import/ocr-extract')

describe('extractRecipeFromImages', () => {
  beforeEach(() => {
    parseMock.mockReset()
  })

  it('sends images as base64 content parts and returns parsed recipe', async () => {
    parseMock.mockResolvedValueOnce({
      choices: [{
        message: {
          parsed: {
            title: 'Pannkakor',
            description: 'Klassiska svenska pannkakor',
            ingredients: ['3 dl mjöl', '6 dl mjölk', '3 ägg', '1 msk smör'],
            steps: ['Vispa ihop smeten', 'Stek i smör'],
            cookingTimeMinutes: 20,
            servings: 4,
            suggestedTagNames: ['Snabblagat'],
          },
        },
      }],
    })

    const images = [
      { base64: 'aW1hZ2UxZGF0YQ==', mimeType: 'image/jpeg' },
      { base64: 'aW1hZ2UyZGF0YQ==', mimeType: 'image/png' },
    ]

    const result = await extractRecipeFromImages(images, ['Snabblagat', 'Barnvänligt'], 'test-key')

    expect(result).not.toBeNull()
    expect(result!.title).toBe('Pannkakor')
    expect(result!.ingredients).toHaveLength(4)
    expect(result!.steps).toEqual(['Vispa ihop smeten', 'Stek i smör'])
    expect(result!.suggestedTagNames).toEqual(['Snabblagat'])

    // Verify images were sent as content parts
    expect(parseMock).toHaveBeenCalledOnce()
    const callArgs = parseMock.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toHaveLength(3) // 1 text + 2 images
    expect(userMessage.content[1].type).toBe('image_url')
    expect(userMessage.content[2].type).toBe('image_url')
  })

  it('returns null when API returns no parsed data', async () => {
    parseMock.mockResolvedValueOnce({
      choices: [{ message: { parsed: null } }],
    })

    const result = await extractRecipeFromImages(
      [{ base64: 'dGVzdA==', mimeType: 'image/jpeg' }],
      [],
      'test-key',
    )

    expect(result).toBeNull()
  })
})
