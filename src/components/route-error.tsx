import { Link, useRouter } from '@tanstack/react-router'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '#/components/ui/button'

type RouteErrorProps = {
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
}

export const RouteError = ({
  title = 'Något gick fel',
  message = 'Ett oväntat fel inträffade.',
  backTo,
  backLabel = 'Tillbaka',
}: RouteErrorProps) => {
  const router = useRouter()

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-800">{title}</h1>
        <p className="mt-2 text-gray-500">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => router.invalidate()}>
            Försök igen
          </Button>
          {backTo && (
            <Link to={backTo}>
              <Button variant="ghost">{backLabel}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export const NotFound = ({
  backTo = '/',
  backLabel = 'Till startsidan',
}: {
  backTo?: string
  backLabel?: string
}) => (
  <div className="flex min-h-[50vh] items-center justify-center px-4">
    <div className="text-center">
      <p className="text-5xl">🍽️</p>
      <h1 className="mt-4 text-xl font-bold text-gray-800">Sidan hittades inte</h1>
      <p className="mt-2 text-gray-500">Den här sidan finns inte eller har flyttats.</p>
      <div className="mt-6">
        <Link to={backTo}>
          <Button>{backLabel}</Button>
        </Link>
      </div>
    </div>
  </div>
)
