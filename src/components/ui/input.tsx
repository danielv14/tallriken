import type { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'>

const Input = ({ className = '', ...props }: InputProps) => {
  return (
    <input
      className={`w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-plum-400 focus:ring-2 focus:ring-plum-100 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export { Input }
