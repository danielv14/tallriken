import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getIsAuthenticated } from '#/auth/server'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tallriken</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/tags"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Taggar
          </Link>
          <form method="post" action="/api/auth/logout">
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm transition hover:bg-gray-200"
            >
              Logga ut
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-gray-600">Inga recept ännu. Börja med att importera ett!</p>
    </main>
  )
}
