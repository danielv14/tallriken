import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useChatStore } from '#/chat/store'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllRecipes, findRecipes } from '#/recipes/server'
import { fetchAllTags } from '#/tags/server'
import { Input } from '#/components/ui/input'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const [recipes, tags] = await Promise.all([fetchAllRecipes(), fetchAllTags()])
    return { recipes, tags }
  },
  component: HomePage,
})

function HomePage() {
  const { recipes: initialRecipes, tags } = Route.useLoaderData()
  const setPageContext = useChatStore((s) => s.setPageContext)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setPageContext({ type: 'home' })
    return () => setPageContext({ type: 'other' })
  }, [setPageContext])

  const handleSearch = async (query: string, tagIds: number[]) => {
    setSearching(true)
    try {
      if (!query.trim() && tagIds.length === 0) {
        setRecipes(initialRecipes)
      } else {
        const results = await findRecipes({
          data: {
            query: query.trim() || undefined,
            tagIds: tagIds.length > 0 ? tagIds : undefined,
          },
        })
        setRecipes(results)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleQueryChange = (value: string) => {
    setSearchQuery(value)
    handleSearch(value, selectedTagIds)
  }

  const toggleTag = (tagId: number) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]
    setSelectedTagIds(newTagIds)
    handleSearch(searchQuery, newTagIds)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Compact nav */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-600 text-sm font-extrabold text-white">
              T
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Tallriken</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/import"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
            >
              Importera
            </Link>
            <Link
              to="/admin/tags"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
            >
              Taggar
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl flex-1 px-4 py-8">
        {/* Search & filters */}
        {initialRecipes.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Sök recept..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-plum-400 focus:ring-2 focus:ring-plum-100 focus:outline-none"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-plum-600 text-white'
                        : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe grid */}
        {recipes.length === 0 ? (
          <div className="mt-16 text-center">
            {searchQuery || selectedTagIds.length > 0 ? (
              <>
                <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">Inga recept matchade din sökning.</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-plum-50">
                  <PlusIcon className="h-6 w-6 text-plum-400" />
                </div>
                <p className="mt-3 text-sm text-gray-500">Inga recept ännu.</p>
                <Link
                  to="/import"
                  className="mt-2 inline-block text-sm font-semibold text-plum-600 hover:text-plum-700"
                >
                  Lägg till ditt första recept
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to="/recipes/$recipeId"
                params={{ recipeId: String(recipe.id) }}
                className="group overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 transition hover:ring-plum-200 hover:shadow-md"
              >
                {recipe.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="aspect-[16/10] w-full object-cover"
                  />
                )}
                <div className="p-4">
                <h2 className="font-bold text-gray-900 group-hover:text-plum-600">{recipe.title}</h2>
                {recipe.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{recipe.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {recipe.cookingTimeMinutes && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {recipe.cookingTimeMinutes} min
                    </span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {recipe.servings} portioner
                    </span>
                  )}
                </div>
                {recipe.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4">
          <form method="post" action="/api/auth/logout">
            <button
              type="submit"
              className="text-sm text-gray-400 transition hover:text-gray-600"
            >
              Logga ut
            </button>
          </form>
        </div>
      </footer>
    </div>
  )
}
