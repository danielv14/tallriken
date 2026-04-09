import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { fetchRecipeById, editRecipe } from '#/recipes/server'
import { fetchAllTags } from '#/tags/server'
import { RecipeForm, type RecipeFormData } from '#/components/recipe-form'
import { Recipe } from '#/recipes/recipe'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_authed/recipes/edit/$recipeId')({
  loader: async ({ params }) => {
    const recipeId = parseInt(params.recipeId, 10)
    const [recipe, tags] = await Promise.all([
      fetchRecipeById({ data: { id: recipeId } }),
      fetchAllTags(),
    ])
    if (!recipe) {
      throw new Error('Receptet hittades inte')
    }
    return { recipe, tags }
  },
  component: EditRecipePage,
})

function EditRecipePage() {
  const { recipe, tags } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initialData = Recipe.toForm(recipe)

  const handleSubmit = async (form: RecipeFormData, formImageUrl?: string) => {
    setError(null)
    try {
      await editRecipe({
        data: { id: recipe.id, ...Recipe.fromForm(form), imageUrl: formImageUrl },
      })
      navigate({ to: '/recipes/$recipeId', params: { recipeId: String(recipe.id) } })
    } catch {
      setError('Kunde inte spara ändringarna. Försök igen.')
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId: String(recipe.id) }}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Redigera recept</h1>
        {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-gray-100">
          <RecipeForm
            initialData={initialData}
            initialImageUrl={recipe.imageUrl ?? undefined}
            tags={tags}
            onSubmit={handleSubmit}
            submitLabel="Spara ändringar"
            onCancel={() => navigate({ to: '/recipes/$recipeId', params: { recipeId: String(recipe.id) } })}
          />
        </div>
      </main>
    </div>
  )
}
