import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllTags } from '#/tags/server'
import { saveRecipe } from '#/recipes/server'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'

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

type RecipeFormData = {
  title: string
  description: string
  ingredients: string
  steps: string
  cookingTimeMinutes: string
  servings: string
  tagIds: number[]
}

const INITIAL_FORM: RecipeFormData = {
  title: '',
  description: '',
  ingredients: '',
  steps: '',
  cookingTimeMinutes: '',
  servings: '',
  tagIds: [],
}

function ImportPage() {
  const tags = Route.useLoaderData()
  const navigate = useNavigate()
  const [form, setForm] = useState<RecipeFormData>(INITIAL_FORM)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const updateField = (field: keyof RecipeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  const canSubmit = form.title.trim() && form.ingredients.trim()

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setShowPreview(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await saveRecipe({
        data: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          ingredients: form.ingredients.split('\n').map((l) => l.trim()).filter(Boolean),
          steps: form.steps.trim()
            ? form.steps.split('\n').map((l) => l.trim()).filter(Boolean)
            : undefined,
          cookingTimeMinutes: form.cookingTimeMinutes
            ? parseInt(form.cookingTimeMinutes, 10)
            : undefined,
          servings: form.servings ? parseInt(form.servings, 10) : undefined,
          tagIds: form.tagIds,
        },
      })
      navigate({ to: '/' })
    } catch {
      setError('Kunde inte spara receptet. Försök igen.')
      setSaving(false)
    }
  }

  if (showPreview) {
    return <RecipePreview form={form} tags={tags} onBack={() => setShowPreview(false)} onSave={handleSave} saving={saving} error={error} />
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Lägg till recept</h1>

      <form onSubmit={handlePreview} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Titel *</span>
          <Input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="T.ex. Pasta Carbonara"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Beskrivning</span>
          <Textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Kort beskrivning av rätten..."
            rows={2}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Ingredienser *</span>
          <Textarea
            value={form.ingredients}
            onChange={(e) => updateField('ingredients', e.target.value)}
            placeholder="En ingrediens per rad, t.ex.&#10;400g spaghetti&#10;200g pancetta&#10;4 äggulor"
            rows={6}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Steg</span>
          <Textarea
            value={form.steps}
            onChange={(e) => updateField('steps', e.target.value)}
            placeholder="Beskriv tillagningen steg för steg..."
            rows={6}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Tillagningstid (min)</span>
            <Input
              type="number"
              value={form.cookingTimeMinutes}
              onChange={(e) => updateField('cookingTimeMinutes', e.target.value)}
              placeholder="T.ex. 30"
              min="1"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Portioner</span>
            <Input
              type="number"
              value={form.servings}
              onChange={(e) => updateField('servings', e.target.value)}
              placeholder="T.ex. 4"
              min="1"
            />
          </label>
        </div>

        {tags.length > 0 && (
          <div>
            <span className="text-sm font-medium">Taggar</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    form.tagIds.includes(tag.id)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={!canSubmit}>
            Förhandsgranska
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/' })}>
            Avbryt
          </Button>
        </div>
      </form>
    </main>
  )
}

type RecipePreviewProps = {
  form: RecipeFormData
  tags: { id: number; name: string }[]
  onBack: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}

function RecipePreview({ form, tags, onBack, onSave, saving, error }: RecipePreviewProps) {
  const selectedTags = tags.filter((t) => form.tagIds.includes(t.id))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Förhandsgranska recept</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{form.title}</h2>
          {form.description && (
            <p className="mt-1 text-gray-600">{form.description}</p>
          )}
        </div>

        <div className="flex gap-6 text-sm text-gray-500">
          {form.cookingTimeMinutes && <span>{form.cookingTimeMinutes} min</span>}
          {form.servings && <span>{form.servings} portioner</span>}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div>
          <h3 className="font-medium">Ingredienser</h3>
          <ul className="mt-2 space-y-1">
            {form.ingredients.split('\n').filter((l) => l.trim()).map((line, i) => (
              <li key={i} className="text-sm">{line.trim()}</li>
            ))}
          </ul>
        </div>

        {form.steps.trim() && (
          <div>
            <h3 className="font-medium">Tillagning</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
              {form.steps.split('\n').filter((l) => l.trim()).map((step, i) => (
                <li key={i}>{step.trim()}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Sparar...' : 'Spara recept'}
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Tillbaka till redigering
        </Button>
      </div>
    </main>
  )
}
