import type { ComponentProps } from 'react'

type TextareaProps = ComponentProps<'textarea'>

const Textarea = ({ className = '', ...props }: TextareaProps) => {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export { Textarea }
