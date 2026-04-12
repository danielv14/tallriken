import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RouteError } from '#/components/route-error'
import { useState } from 'react'
import { fetchRecipeById, editRecipe } from '#/recipes/server'
import { fetchAllTags } from '#/tags/server'
import { PageShell } from '#/components/page-shell'
import { RecipeForm, type RecipeFormData } from '#/components/recipe-form'
import { Recipe } from '#/recipes/recipe'

const EditRecipePage = () => {
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
    <PageShell to="/recipes/$recipeId" params={{ recipeId: String(recipe.id) }}>
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
    </PageShell>
  )
}

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
  head: ({ loaderData }) => ({ meta: [{ title: `Redigera ${loaderData?.recipe.title} | Tallriken` }] }),
  component: EditRecipePage,
  errorComponent: ({ error }) => (
    <RouteError
      title="Receptet kunde inte laddas"
      message={error.message}
      backTo="/"
      backLabel="Tillbaka"
    />
  ),
})
