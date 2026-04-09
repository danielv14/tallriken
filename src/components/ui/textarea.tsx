import type { ComponentProps } from 'react'

type TextareaProps = ComponentProps<'textarea'> & {
  hasError?: boolean
}

const Textarea = ({ className = '', hasError, ...props }: TextareaProps) => {
  return (
    <textarea
      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:outline-none ${
        hasError
          ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 focus:border-plum-400 focus:ring-2 focus:ring-plum-100'
      } ${className}`}
      {...props}
    />
  )
}

export { Textarea }
