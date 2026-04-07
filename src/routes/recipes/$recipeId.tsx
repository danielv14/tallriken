import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchRecipeById, removeRecipe } from '#/recipes/server'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'

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
    const text = recipe.ingredients.join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    await removeRecipe({ data: { id: recipe.id } })
    navigate({ to: '/' })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Tillbaka
      </Link>

      <div className="mt-6">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <div className="flex gap-2">
            <Link to="/recipes/$recipeId/edit" params={{ recipeId: String(recipe.id) }}>
              <Button variant="secondary" size="sm">Redigera</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)}>
              Ta bort
            </Button>
          </div>
        </div>

        {recipe.description && (
          <p className="mt-2 text-gray-600">{recipe.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {recipe.cookingTimeMinutes && <span>{recipe.cookingTimeMinutes} min</span>}
          {recipe.servings && <span>{recipe.servings} portioner</span>}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              Källa
            </a>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ingredienser</h2>
          <Button variant="ghost" size="sm" onClick={handleCopyIngredients}>
            {copied ? 'Kopierat!' : 'Kopiera'}
          </Button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="text-sm">{ingredient}</li>
          ))}
        </ul>
      </section>

      {recipe.steps && recipe.steps.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Tillagning</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Ta bort recept"
        description={`Är du säker på att du vill ta bort "${recipe.title}"?`}
        onConfirm={handleDelete}
      />
    </main>
  )
}
