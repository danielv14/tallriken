import { useChatStore } from '#/chat/store'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

const ChatToggle = () => {
  const { toggle, isOpen } = useChatStore()

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition ${
        isOpen
          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
      aria-label={isOpen ? 'Stäng chatten' : 'Öppna chatten'}
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" />
    </button>
  )
}

export { ChatToggle }
