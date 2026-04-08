import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchRecipeById, removeRecipe } from '#/recipes/server'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ArrowLeftIcon,
  ClockIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/recipes/$recipeId')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ params }) => {
    const recipe = await fetchRecipeById({ data: { id: parseInt(params.recipeId, 10) } })
    if (!recipe) {
      throw new Error('Receptet hittades inte')
    }
    return recipe
  },
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const recipe = Route.useLoaderData()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleCopyIngredients = async () => {
    const text = recipe.ingredients
      .map((g) => {
        const header = g.group ? `${g.group}\n` : ''
        return header + g.items.join('\n')
      })
      .join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    await removeRecipe({ data: { id: recipe.id } })
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen">
      {/* Compact header */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
          <div className="flex gap-1">
            <Link to="/recipes/edit/$recipeId" params={{ recipeId: String(recipe.id) }}>
              <Button variant="ghost" size="sm">Redigera</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <span className="text-red-500">Ta bort</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-100">
          {/* Title & meta */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{recipe.title}</h1>
            {recipe.description && (
              <p className="mt-2 leading-relaxed text-gray-500">{recipe.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {recipe.cookingTimeMinutes && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  {recipe.cookingTimeMinutes} min
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  {recipe.servings} portioner
                </span>
              )}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-plum-600 hover:text-plum-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  Källa
                </a>
              )}
            </div>
            {recipe.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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

          <hr className="my-6 border-gray-100" />

          {/* Ingredients */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Ingredienser</h2>
              <button
                onClick={handleCopyIngredients}
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
            </div>
            <div className="mt-3 space-y-4">
              {recipe.ingredients.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.group && (
                    <h3 className="mb-2 text-sm font-bold text-gray-600">{group.group}</h3>
                  )}
                  <ul className="space-y-2">
                    {group.items.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-base text-gray-700">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-plum-400" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <>
              <hr className="my-6 border-gray-100" />
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Tillagning</h2>
                <ol className="mt-3 space-y-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-base leading-relaxed text-gray-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Ta bort recept"
        description={`Är du säker på att du vill ta bort "${recipe.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
