import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllTags } from '#/tags/server'
import { saveRecipe } from '#/recipes/server'
import { Button } from '#/components/ui/button'
import { RecipeForm, type RecipeFormData } from '#/components/recipe-form'

export const Route = createFileRoute('/import')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: () => fetchAllTags(),
  component: ImportPage,
})

function ImportPage() {
  const tags = Route.useLoaderData()
  const navigate = useNavigate()
  const [previewData, setPreviewData] = useState<RecipeFormData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!previewData) return
    setSaving(true)
    setError(null)
    try {
      const filledIngredients = previewData.ingredients.filter((i) => i.trim()).map((i) => i.trim())
      const filledSteps = previewData.steps.filter((s) => s.trim()).map((s) => s.trim())
      await saveRecipe({
        data: {
          title: previewData.title.trim(),
          description: previewData.description.trim() || undefined,
          ingredients: filledIngredients,
          steps: filledSteps.length > 0 ? filledSteps : undefined,
          cookingTimeMinutes: previewData.cookingTimeMinutes
            ? parseInt(previewData.cookingTimeMinutes, 10)
            : undefined,
          servings: previewData.servings ? parseInt(previewData.servings, 10) : undefined,
          tagIds: previewData.tagIds,
        },
      })
      navigate({ to: '/' })
    } catch (err) {
      console.error('Save recipe failed:', err)
      setError('Kunde inte spara receptet. Försök igen.')
      setSaving(false)
    }
  }

  if (previewData) {
    const filledIngredients = previewData.ingredients.filter((i) => i.trim())
    const filledSteps = previewData.steps.filter((s) => s.trim())
    const selectedTags = tags.filter((t) => previewData.tagIds.includes(t.id))

    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Förhandsgranska recept</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">{previewData.title}</h2>
            {previewData.description && <p className="mt-1 text-gray-600">{previewData.description}</p>}
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            {previewData.cookingTimeMinutes && <span>{previewData.cookingTimeMinutes} min</span>}
            {previewData.servings && <span>{previewData.servings} portioner</span>}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span key={tag.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{tag.name}</span>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-medium">Ingredienser</h3>
            <ul className="mt-2 space-y-1">
              {filledIngredients.map((ingredient, i) => (
                <li key={i} className="text-sm">{ingredient.trim()}</li>
              ))}
            </ul>
          </div>

          {filledSteps.length > 0 && (
            <div>
              <h3 className="font-medium">Tillagning</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                {filledSteps.map((step, i) => (
                  <li key={i}>{step.trim()}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sparar...' : 'Spara recept'}
          </Button>
          <Button variant="ghost" onClick={() => setPreviewData(null)} disabled={saving}>
            Tillbaka till redigering
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Lägg till recept</h1>
      <div className="mt-6">
        <RecipeForm
          tags={tags}
          onSubmit={setPreviewData}
          submitLabel="Förhandsgranska"
          onCancel={() => navigate({ to: '/' })}
        />
      </div>
    </main>
  )
}
