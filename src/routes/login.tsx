import { createFileRoute, redirect } from '@tanstack/react-router'
import { getIsAuthenticated } from '#/auth/server'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error as string | undefined,
  }),
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { error } = Route.useSearch()

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-plum-600 text-xl font-extrabold text-white">
            T
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">Tallriken</h1>
        </div>
        {error === 'invalid' && (
          <div className="mt-6 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            Fel lösenord
          </div>
        )}
        <form method="post" action="/api/auth/login" className="mt-6 space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Lösenord"
            autoFocus
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-plum-400 focus:ring-2 focus:ring-plum-100 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-plum-600 px-4 py-3 font-semibold text-white transition hover:bg-plum-700"
          >
            Logga in
          </button>
        </form>
      </div>
    </main>
  )
}
