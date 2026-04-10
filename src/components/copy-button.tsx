import { useCopyToClipboard } from '#/hooks/use-copy-to-clipboard'
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

type CopyButtonProps = {
  text: string
  className?: string
}

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <button
      onClick={() => copy(text)}
      className={className ?? 'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'}
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
          Kopierat
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          Kopiera
        </>
      )}
    </button>
  )
}
