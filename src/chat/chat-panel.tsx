import { useState, useRef, useEffect } from 'react'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import { useChatStore } from '#/chat/store'
import { Markdown } from '#/components/markdown'
import { Button } from '#/components/ui/button'
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'

const CONTEXT_PREFIX_REGEX = /^\[KONTEXT:.*?\]\n/

const stripContextPrefix = (text: string): string => {
  return text.replace(CONTEXT_PREFIX_REGEX, '')
}

const TOOL_LABELS: Record<string, string> = {
  search_recipes: 'Söker recept...',
  get_weekly_menu: 'Hämtar veckomenyn...',
  add_to_weekly_menu: 'Lägger till i veckomenyn...',
}


type ChatMessageData = {
  id: string
  role: string
  parts: Array<{ type: string; name?: string; content?: string }>
}

type ChatMessageProps = {
  message: ChatMessageData
  isLoading: boolean
  copiedId: string | null
  onCopy: (text: string, messageId: string) => void
}

const isToolOnlyMessage = (message: ChatMessageData): boolean =>
  message.role === 'assistant' &&
  message.parts.some((p) => p.type === 'tool-call') &&
  message.parts
    .filter((p) => p.type === 'text')
    .every((p) => !('content' in p) || !p.content?.trim())

const ChatMessage = ({ message, isLoading, copiedId, onCopy }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant'
  const textParts = message.parts.filter((p) => p.type === 'text')
  const textContent = textParts
    .map((p) => ('content' in p ? p.content : ''))
    .join('')
    .trim()

  const toolCallParts = message.parts.filter((p) => p.type === 'tool-call')

  if (isAssistant && isToolOnlyMessage(message)) {
    if (!isLoading) return null
    const lastToolCall = toolCallParts[toolCallParts.length - 1]
    return (
      <div className="mb-4">
        <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-400">
          {TOOL_LABELS[lastToolCall.name ?? ''] ?? 'Arbetar...'}
        </div>
      </div>
    )
  }

  if (isAssistant && textContent === '') {
    return null
  }

  return (
    <div className={`${isAssistant ? 'mb-8' : 'mb-4 flex justify-end'}`}>
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isAssistant
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gray-900 text-white'
        }`}
      >
        {textParts.map((part, idx) => {
          const rawContent = 'content' in part ? part.content ?? '' : ''
          const content = stripContextPrefix(rawContent)
          if (!content) return null
          return isAssistant ? (
            <Markdown key={idx} content={content} />
          ) : (
            <div key={idx} className="whitespace-pre-wrap">{content}</div>
          )
        })}
        {isAssistant && textContent && (
          <button
            onClick={() => onCopy(textContent, message.id)}
            className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600"
          >
            {copiedId === message.id ? (
              <>
                <CheckIcon className="h-3 w-3" />
                Kopierat
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-3 w-3" />
                Kopiera
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

const ChatPanel = () => {
  const { isOpen, close, pageContext } = useChatStore()
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, isLoading, clear } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const message = pageContext.type === 'recipe'
        ? `[KONTEXT: Användaren tittar på receptet "${pageContext.recipeTitle}" (ID: ${pageContext.recipeId}, URL: /recipes/${pageContext.recipeId})]\n${input}`
        : input
      sendMessage(message)
      setInput('')
    }
  }

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl transition-transform duration-300 ease-out md:w-[420px] md:border-l md:border-gray-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Receptassistenten</h2>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                title="Rensa chatten"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>Hej! Jag kan hjälpa dig att:</p>
              <ul className="mt-3 space-y-1.5 text-left">
                <li>Hitta recept i din samling</li>
                <li>Föreslå veckomenyer</li>
                <li>Skapa inköpslistor</li>
                <li>Skala recept till fler portioner</li>
              </ul>
            </div>
          )}
          {messages.map((message, index) => {
            if (isToolOnlyMessage(message)) {
              const hasLaterToolOnly = messages.slice(index + 1).some(isToolOnlyMessage)
              if (hasLaterToolOnly) return null
            }

            return (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            )
          })}
          {isLoading && !messages.some(isToolOnlyMessage) && (
            <div className="mb-4">
              <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-400">
                Tänker...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                const maxHeight = 96
                const newHeight = Math.min(e.target.scrollHeight, maxHeight)
                e.target.style.height = `${newHeight}px`
                e.target.style.overflowY = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    handleSubmit(e)
                  }
                }
              }}
              placeholder="Ställ en fråga..."
              className="flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} size="sm">
              Skicka
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export { ChatPanel }
