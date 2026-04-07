import { createFileRoute, redirect, useSearch } from '@tanstack/react-router'
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
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-3xl font-bold">Tallriken</h1>
        {error === 'invalid' && (
          <p className="text-center text-sm text-red-600">Fel lösenord</p>
        )}
        <form method="post" action="/api/auth/login" className="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Lösenord"
            autoFocus
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-white transition hover:bg-gray-800"
          >
            Logga in
          </button>
        </form>
      </div>
    </main>
  )
}
