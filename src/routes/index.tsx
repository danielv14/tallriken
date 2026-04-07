import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllRecipes } from '#/recipes/server'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: () => fetchAllRecipes(),
  component: HomePage,
})

function HomePage() {
  const recipes = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tallriken</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/import"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Importera
          </Link>
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

      {recipes.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-gray-500">Inga recept ännu.</p>
          <Link
            to="/import"
            className="mt-2 inline-block text-sm font-medium text-gray-900 underline"
          >
            Lägg till ditt första recept
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to="/recipes/$recipeId"
              params={{ recipeId: String(recipe.id) }}
              className="group rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:shadow-sm"
            >
              <h2 className="font-semibold group-hover:text-gray-700">{recipe.title}</h2>
              {recipe.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{recipe.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {recipe.cookingTimeMinutes && (
                  <span className="text-xs text-gray-400">{recipe.cookingTimeMinutes} min</span>
                )}
                {recipe.servings && (
                  <span className="text-xs text-gray-400">{recipe.servings} portioner</span>
                )}
              </div>
              {recipe.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
