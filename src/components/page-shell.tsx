import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type BackLink = {
  to: string
  params?: Record<string, string>
  onBack?: never
}

type BackButton = {
  to?: never
  params?: never
  onBack: () => void
}

type PageShellProps = (BackLink | BackButton) & {
  label?: string
  children: React.ReactNode
}

export const PageShell = ({
  to,
  params,
  onBack,
  label = 'Tillbaka',
  children,
}: PageShellProps) => (
  <div className="min-h-screen">
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {label}
          </button>
        ) : (
          <Link
            to={to}
            params={params}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {label}
          </Link>
        )}
      </div>
    </nav>
    <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
  </div>
)
