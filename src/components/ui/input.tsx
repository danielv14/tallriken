import type { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'>

const Input = ({ className = '', ...props }: InputProps) => {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export { Input }
