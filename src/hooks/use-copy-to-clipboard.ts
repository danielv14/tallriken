import { useState } from 'react'

export const useCopyToClipboard = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), resetMs)
  }

  return { copied, copy }
}
