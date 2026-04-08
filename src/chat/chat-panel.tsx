import { useState, useRef, useEffect } from 'react'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import { useChatStore } from '#/chat/store'
import { Markdown } from '#/components/markdown'
import { Button } from '#/components/ui/button'
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

const CONTEXT_PREFIX_REGEX = /^\[KONTEXT:.*?\]\n/

const stripContextPrefix = (text: string): string => {
  return text.replace(CONTEXT_PREFIX_REGEX, '')
}

const ChatPanel = () => {
  const { isOpen, close, pageContext } = useChatStore()
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildMessageWithContext = (text: string): string => {
    if (pageContext.type === 'recipe') {
      return `[KONTEXT: Användaren tittar på receptet "${pageContext.recipeTitle}" (ID: ${pageContext.recipeId}, URL: /recipes/${pageContext.recipeId})]\n${text}`
    }
    return text
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(buildMessageWithContext(input))
      setInput('')
    }
  }

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl md:w-[420px] md:border-l md:border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Receptassistenten</h2>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
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
          {messages.map((message) => {
            const isAssistant = message.role === 'assistant'
            const textContent = message.parts
              .filter((p) => p.type === 'text')
              .map((p) => ('content' in p ? p.content : ''))
              .join('')

            return (
              <div
                key={message.id}
                className={`mb-4 ${isAssistant ? '' : 'flex justify-end'}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isAssistant
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-gray-900 text-white'
                  }`}
                >
                  {message.parts.map((part, idx) => {
                    if (part.type === 'text') {
                      const rawContent = 'content' in part ? part.content : ''
                      const content = stripContextPrefix(rawContent)
                      return isAssistant ? (
                        <Markdown key={idx} content={content} />
                      ) : (
                        <div key={idx} className="whitespace-pre-wrap">{content}</div>
                      )
                    }
                    return null
                  })}
                  {isAssistant && textContent && (
                    <button
                      onClick={() => handleCopy(textContent, message.id)}
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
          })}
          {isLoading && (
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
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ställ en fråga..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
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
