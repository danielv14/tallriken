import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchMenu, removeRecipeFromMenu, clearAllMenu, toggleRecipeComplete } from '#/menu/server'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ArrowLeftIcon,
  TrashIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'

export const Route = createFileRoute('/weekly-menu')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: () => fetchMenu(),
  component: WeeklyMenuPage,
})

function WeeklyMenuPage() {
  const initialMenu = Route.useLoaderData()
  const [menu, setMenu] = useState(initialMenu)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleToggleComplete = async (recipeId: number) => {
    setMenu((prev) =>
      prev.map((item) =>
        item.recipe.id === recipeId
          ? { ...item, completedAt: item.completedAt ? null : new Date() }
          : item,
      ),
    )
    await toggleRecipeComplete({ data: { recipeId } })
  }

  const handleRemove = async (recipeId: number) => {
    setMenu((prev) => prev.filter((item) => item.recipe.id !== recipeId))
    await removeRecipeFromMenu({ data: { recipeId } })
  }

  const handleClear = async () => {
    setMenu([])
    await clearAllMenu()
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Veckans meny</h1>
          {menu.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
            >
              Rensa allt
            </Button>
          )}
        </div>

        {menu.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-plum-50">
              <CalendarIcon className="h-6 w-6 text-plum-400" />
            </div>
            <p className="mt-3 text-sm text-gray-500">Inga recept i veckans meny.</p>
            <Link
              to="/"
              className="mt-2 inline-block text-sm font-semibold text-plum-600 hover:text-plum-700"
            >
              Bläddra bland recept
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {menu.map((item) => {
              const isCooked = !!item.completedAt
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-gray-100 transition ${
                    isCooked ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => handleToggleComplete(item.recipe.id)}
                    className={`shrink-0 transition ${
                      isCooked ? 'text-green-500' : 'text-gray-300 hover:text-green-400'
                    }`}
                    title={isCooked ? 'Markera som ej tillagad' : 'Markera som tillagad'}
                  >
                    {isCooked ? (
                      <CheckCircleIconSolid className="h-6 w-6" />
                    ) : (
                      <CheckCircleIcon className="h-6 w-6" />
                    )}
                  </button>
                  {item.recipe.imageUrl && (
                    <img
                      src={item.recipe.imageUrl}
                      alt={item.recipe.title}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/recipes/$recipeId"
                      params={{ recipeId: String(item.recipe.id) }}
                      className={`font-bold transition ${
                        isCooked
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900 hover:text-plum-600'
                      }`}
                    >
                      {item.recipe.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      {item.recipe.cookingTimeMinutes && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {item.recipe.cookingTimeMinutes} min
                        </span>
                      )}
                      {item.recipe.servings && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {item.recipe.servings} portioner
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.recipe.id)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <ConfirmDialog
          open={showClearConfirm}
          onOpenChange={setShowClearConfirm}
          title="Rensa veckans meny"
          description="Vill du ta bort alla recept från veckans meny?"
          confirmLabel="Rensa"
          onConfirm={handleClear}
        />
      </main>
    </div>
  )
}
