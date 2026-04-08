import type { ComponentProps } from 'react'

type TextareaProps = ComponentProps<'textarea'>

const Textarea = ({ className = '', ...props }: TextareaProps) => {
  return (
    <textarea
      className={`w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-plum-400 focus:ring-2 focus:ring-plum-100 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export { Textarea }
