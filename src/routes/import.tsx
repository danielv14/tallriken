import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllTags } from '#/tags/server'
import { saveRecipe } from '#/recipes/server'
import { extractRecipeFromUrl } from '#/import/server'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
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

type ImportTab = 'url' | 'manual'

function ImportPage() {
  const tags = Route.useLoaderData()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ImportTab>('url')
  const [previewData, setPreviewData] = useState<RecipeFormData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // URL import state
  const [url, setUrl] = useState('')
  const [extracting, setExtracting] = useState(false)

  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setExtracting(true)
    setError(null)
    try {
      const result = await extractRecipeFromUrl({ data: { url: url.trim() } })
      setPreviewData({
        title: result.title,
        description: result.description ?? '',
        ingredients: result.ingredients.length > 0 ? result.ingredients : [''],
        steps: result.steps && result.steps.length > 0 ? result.steps : [''],
        cookingTimeMinutes: result.cookingTimeMinutes ? String(result.cookingTimeMinutes) : '',
        servings: result.servings ? String(result.servings) : '',
        tagIds: result.tagIds,
      })
    } catch (err) {
      console.error('URL extract failed:', err)
      setError('Kunde inte hämta recept från den angivna URL:en. Prova att lägga till manuellt istället.')
    } finally {
      setExtracting(false)
    }
  }

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

  // Preview/edit mode -- show the shared form pre-filled
  if (previewData) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Granska och spara recept</h1>
        <p className="mt-2 text-sm text-gray-500">Granska och redigera receptet innan du sparar.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6">
          <RecipeForm
            initialData={previewData}
            tags={tags}
            onSubmit={(form) => {
              setPreviewData(form)
              handleSave()
            }}
            submitLabel={saving ? 'Sparar...' : 'Spara recept'}
            onCancel={() => setPreviewData(null)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Lägg till recept</h1>

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === 'url'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Från URL
        </button>
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === 'manual'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manuellt
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {tab === 'url' && (
        <form onSubmit={handleExtractUrl} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Receptets URL</span>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.ica.se/recept/..."
              required
            />
          </label>
          <p className="text-xs text-gray-400">
            Klistra in en länk till ett recept. Vi försöker automatiskt hämta och extrahera receptet.
          </p>
          <div className="flex gap-3">
            <Button type="submit" disabled={extracting || !url.trim()}>
              {extracting ? 'Hämtar recept...' : 'Hämta recept'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: '/' })}>
              Avbryt
            </Button>
          </div>
        </form>
      )}

      {tab === 'manual' && (
        <div className="mt-6">
          <RecipeForm
            tags={tags}
            onSubmit={setPreviewData}
            submitLabel="Förhandsgranska"
            onCancel={() => navigate({ to: '/' })}
          />
        </div>
      )}
    </main>
  )
}
