import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { useCopyToClipboard } from '#/hooks/use-copy-to-clipboard'
import { fetchMenu, removeRecipeFromMenu, clearAllMenu, toggleRecipeComplete, generateAndSaveShoppingList, fetchShoppingList } from '#/menu/server'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ArrowLeftIcon,
  TrashIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'

export const Route = createFileRoute('/weekly-menu')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const [menu, savedShoppingList] = await Promise.all([
      fetchMenu(),
      fetchShoppingList(),
    ])
    return { menu, savedShoppingList }
  },
  component: WeeklyMenuPage,
})

function WeeklyMenuPage() {
  const { menu: initialMenu, savedShoppingList } = Route.useLoaderData()
  const [menu, setMenu] = useState(initialMenu)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [shoppingList, setShoppingList] = useState<string | null>(savedShoppingList)
  const [shoppingListOpen, setShoppingListOpen] = useState(!savedShoppingList)
  const [generating, setGenerating] = useState(false)
  const { copied, copy: copyToClipboard } = useCopyToClipboard()

  const handleGenerateShoppingList = async () => {
    setGenerating(true)
    try {
      const content = await generateAndSaveShoppingList()
      setShoppingList(content)
      setShoppingListOpen(true)
    } catch (err) {
      console.error('Failed to generate shopping list:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyShoppingList = async () => {
    if (!shoppingList) return
    const plainText = shoppingList
      .replace(/^## /gm, '')
      .replace(/^- /gm, '  ')
    await copyToClipboard(plainText)
  }

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

        {/* Shopping list */}
        {menu.length > 0 && (
          <div className="mt-6 rounded-xl bg-white ring-1 ring-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => shoppingList && setShoppingListOpen(!shoppingListOpen)}
                className="flex items-center gap-2 text-sm font-bold text-gray-700"
                disabled={!shoppingList}
              >
                {shoppingList && (shoppingListOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                ))}
                Inköpslista
              </button>
              <div className="flex items-center gap-2">
                {shoppingList && (
                  <button
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                        Kopierat
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        Kopiera
                      </>
                    )}
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={handleGenerateShoppingList}
                  disabled={generating}
                >
                  <SparklesIcon className="mr-1 h-4 w-4" />
                  {generating ? 'Genererar...' : shoppingList ? 'Generera ny' : 'Generera'}
                </Button>
              </div>
            </div>
            {shoppingList && shoppingListOpen && (
              <div className="border-t border-gray-100 px-4 py-4 prose prose-sm prose-gray max-w-none">
                {shoppingList.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h3 key={i} className="mt-3 first:mt-0 mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">{line.replace('## ', '')}</h3>
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="my-0.5 text-sm text-gray-700">{line}</p>
                  }
                  return line ? <p key={i} className="my-0.5 text-sm text-gray-500">{line}</p> : null
                })}
              </div>
            )}
          </div>
        )}

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
