import { describe, it, expect, vi } from 'vitest'
import type { AnyTextAdapter, StreamChunk, TextOptions } from '@tanstack/ai'
import { createChatEngine, SYSTEM_PROMPT } from '#/chat/engine'
import { createTestDb, createTestRecipe, createTestTag } from '#/test-utils'
import { getMenu, addToMenu } from '#/menu/crud'

type ChatStreamSpy = ReturnType<typeof vi.fn<(options: TextOptions) => AsyncIterable<StreamChunk>>>

const createFakeAdapter = () => {
  const chatStream: ChatStreamSpy = vi.fn((_options) => {
    return (async function* () {
      // No-op stream. Tests inspect the call args, not the output.
    })()
  })

  const adapter = {
    kind: 'text',
    name: 'fake',
    model: 'fake-model',
    '~types': {} as AnyTextAdapter['~types'],
    chatStream,
    structuredOutput: vi.fn(),
  } as unknown as AnyTextAdapter

  return { adapter, chatStream }
}

const consume = async (stream: AsyncIterable<StreamChunk>) => {
  const chunks: StreamChunk[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return chunks
}

describe('createChatEngine', () => {
  it('includes the full system prompt in the adapter call', async () => {
    const db = createTestDb()
    const { adapter, chatStream } = createFakeAdapter()

    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'Hej!' }],
        conversationId: 'conv-1',
      }),
    )

    expect(chatStream).toHaveBeenCalledTimes(1)
    const options = chatStream.mock.calls[0][0]
    expect(options.systemPrompts).toHaveLength(1)
    expect(options.systemPrompts?.[0]).toContain(SYSTEM_PROMPT)
  })

  it('includes recipe titles and ids in the system prompt', async () => {
    const db = createTestDb()
    await createTestRecipe(db, { title: 'Pasta Carbonara' })
    await createTestRecipe(db, { title: 'Köttbullar med potatismos' })
    const { adapter, chatStream } = createFakeAdapter()

    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'Vad kan jag laga?' }],
        conversationId: 'conv-2',
      }),
    )

    const systemPrompt = chatStream.mock.calls[0][0].systemPrompts?.[0] ?? ''
    expect(systemPrompt).toContain('Pasta Carbonara')
    expect(systemPrompt).toContain('Köttbullar med potatismos')
    expect(systemPrompt).toContain('RECEPTSAMLING (2 recept)')
  })

  it('reflects recipe changes between calls (recipes loaded per request)', async () => {
    const db = createTestDb()
    const { adapter, chatStream } = createFakeAdapter()
    const engine = createChatEngine({ db, adapter })

    await consume(
      await engine.chat({ messages: [{ role: 'user', content: 'först' }], conversationId: 'a' }),
    )
    const firstPrompt = chatStream.mock.calls[0][0].systemPrompts?.[0] ?? ''
    expect(firstPrompt).toContain('Receptsamlingen är tom.')

    await createTestRecipe(db, { title: 'Lax i ugn' })

    await consume(
      await engine.chat({ messages: [{ role: 'user', content: 'igen' }], conversationId: 'b' }),
    )
    const secondPrompt = chatStream.mock.calls[1][0].systemPrompts?.[0] ?? ''
    expect(secondPrompt).toContain('Lax i ugn')
  })

  it('handles an empty recipe collection gracefully', async () => {
    const db = createTestDb()
    const { adapter, chatStream } = createFakeAdapter()

    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'Hej!' }],
        conversationId: 'conv-empty',
      }),
    )

    const systemPrompt = chatStream.mock.calls[0][0].systemPrompts?.[0] ?? ''
    expect(systemPrompt).toContain('Receptsamlingen är tom.')
    expect(systemPrompt).toContain('RECEPTSAMLING (0 recept)')
  })

  it('forwards user and assistant messages to the adapter', async () => {
    const db = createTestDb()
    const { adapter, chatStream } = createFakeAdapter()

    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [
          { role: 'user', content: 'Hej!' },
          { role: 'assistant', content: 'Hej tillbaka!' },
          { role: 'user', content: 'Vad kan jag laga?' },
        ],
        conversationId: 'conv-forward',
      }),
    )

    const forwardedMessages = chatStream.mock.calls[0][0].messages
    const contents = forwardedMessages.map((m) => m.content)
    expect(contents).toContain('Hej!')
    expect(contents).toContain('Hej tillbaka!')
    expect(contents).toContain('Vad kan jag laga?')
  })

  it('registers get_weekly_menu and add_to_weekly_menu tools', async () => {
    const db = createTestDb()
    const { adapter, chatStream } = createFakeAdapter()

    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'Visa veckomenyn' }],
        conversationId: 'conv-tools',
      }),
    )

    const tools = chatStream.mock.calls[0][0].tools ?? []
    const toolNames = tools.map((t) => t.name)
    expect(toolNames).toEqual(['get_weekly_menu', 'add_to_weekly_menu'])
  })

  it('get_weekly_menu tool returns menu items from the database', async () => {
    const db = createTestDb()
    const tag = await createTestTag(db, 'Snabblagat')
    const recipe = await createTestRecipe(db, {
      title: 'Pasta Carbonara',
      cookingTimeMinutes: 25,
      servings: 4,
      tagIds: [tag.id],
    })
    await addToMenu(db, recipe.id)

    const { adapter, chatStream } = createFakeAdapter()
    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'menu?' }],
        conversationId: 'conv-menu',
      }),
    )

    const tools = chatStream.mock.calls[0][0].tools ?? []
    const getMenuTool = tools.find((t) => t.name === 'get_weekly_menu')!
    const result = await getMenuTool.execute!({})

    expect(result).toEqual([
      {
        recipeId: recipe.id,
        title: 'Pasta Carbonara',
        cookingTimeMinutes: 25,
        servings: 4,
        cooked: false,
      },
    ])
  })

  it('add_to_weekly_menu tool adds a recipe to the menu', async () => {
    const db = createTestDb()
    const recipe = await createTestRecipe(db, { title: 'Lax i ugn' })

    const { adapter, chatStream } = createFakeAdapter()
    const engine = createChatEngine({ db, adapter })
    await consume(
      await engine.chat({
        messages: [{ role: 'user', content: 'lägg till' }],
        conversationId: 'conv-add',
      }),
    )

    const tools = chatStream.mock.calls[0][0].tools ?? []
    const addTool = tools.find((t) => t.name === 'add_to_weekly_menu')!
    const result = await addTool.execute!({ recipeId: recipe.id })

    expect(result).toEqual({ success: true, message: 'Receptet har lagts till i veckomenyn.' })
    const menu = await getMenu(db)
    expect(menu).toHaveLength(1)
    expect(menu[0].recipe.id).toBe(recipe.id)
  })
})
