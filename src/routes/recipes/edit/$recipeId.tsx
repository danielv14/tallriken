import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchRecipeById, editRecipe } from '#/recipes/server'
import { fetchAllTags } from '#/tags/server'
import { RecipeForm, type RecipeFormData } from '#/components/recipe-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/recipes/edit/$recipeId')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
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

  const initialData: RecipeFormData = {
    title: recipe.title,
    description: recipe.description ?? '',
    ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
    steps: recipe.steps && recipe.steps.length > 0 ? recipe.steps : [''],
    cookingTimeMinutes: recipe.cookingTimeMinutes ? String(recipe.cookingTimeMinutes) : '',
    servings: recipe.servings ? String(recipe.servings) : '',
    tagIds: recipe.tags.map((t) => t.id),
  }

  const handleSubmit = async (form: RecipeFormData) => {
    setError(null)
    try {
      const filledIngredients = form.ingredients.filter((i) => i.trim()).map((i) => i.trim())
      const filledSteps = form.steps.filter((s) => s.trim()).map((s) => s.trim())
      await editRecipe({
        data: {
          id: recipe.id,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          ingredients: filledIngredients,
          steps: filledSteps.length > 0 ? filledSteps : undefined,
          cookingTimeMinutes: form.cookingTimeMinutes
            ? parseInt(form.cookingTimeMinutes, 10)
            : undefined,
          servings: form.servings ? parseInt(form.servings, 10) : undefined,
          tagIds: form.tagIds,
        },
      })
      navigate({ to: '/recipes/$recipeId', params: { recipeId: String(recipe.id) } })
    } catch (err) {
      console.error('Edit recipe failed:', err)
      setError('Kunde inte spara ändringarna. Försök igen.')
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
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

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Redigera recept</h1>
        {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-gray-100">
          <RecipeForm
            initialData={initialData}
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
