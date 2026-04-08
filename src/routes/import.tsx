import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllTags } from '#/tags/server'
import { saveRecipe } from '#/recipes/server'
import { extractRecipeFromUrl } from '#/import/server'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { RecipeForm, type RecipeFormData } from '#/components/recipe-form'
import {
  ArrowLeftIcon,
  GlobeAltIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

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

  if (previewData) {
    return (
      <div className="min-h-screen">
        <nav className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
            <button onClick={() => setPreviewData(null)} className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
              <ArrowLeftIcon className="h-4 w-4" />
              Tillbaka
            </button>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Granska recept</h1>
          <p className="mt-1 text-sm text-gray-500">Granska och redigera innan du sparar.</p>
          {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-gray-100">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Lägg till recept</h1>

        {/* Tabs */}
        <div className="mt-5 flex gap-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition ${
              tab === 'url'
                ? 'border-plum-600 text-plum-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <GlobeAltIcon className="h-4 w-4" />
            Från URL
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition ${
              tab === 'manual'
                ? 'border-plum-600 text-plum-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PencilIcon className="h-4 w-4" />
            Manuellt
          </button>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        {tab === 'url' && (
          <div className="mt-5 rounded-xl bg-white p-5 ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">
              Klistra in en länk till ett recept. Vi försöker automatiskt hämta och extrahera det.
            </p>
            <form onSubmit={handleExtractUrl} className="mt-4 space-y-4">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.ica.se/recept/..."
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={extracting || !url.trim()}>
                  {extracting ? 'Hämtar recept...' : 'Hämta recept'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate({ to: '/' })}>
                  Avbryt
                </Button>
              </div>
            </form>
          </div>
        )}

        {tab === 'manual' && (
          <div className="mt-5 rounded-xl bg-white p-5 ring-1 ring-gray-100">
            <RecipeForm
              tags={tags}
              onSubmit={setPreviewData}
              submitLabel="Förhandsgranska"
              onCancel={() => navigate({ to: '/' })}
            />
          </div>
        )}
      </main>
    </div>
  )
}
