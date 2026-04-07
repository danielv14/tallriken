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
  ingredients: string[]
  steps: string[]
  cookingTimeMinutes: string
  servings: string
  tagIds: number[]
}

const INITIAL_FORM: RecipeFormData = {
  title: '',
  description: '',
  ingredients: [''],
  steps: [''],
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

  const updateField = (field: 'title' | 'description' | 'cookingTimeMinutes' | 'servings', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateListItem = (field: 'ingredients' | 'steps', index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const addListItem = (field: 'ingredients' | 'steps') => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  const removeListItem = (field: 'ingredients' | 'steps', index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].length > 1 ? prev[field].filter((_, i) => i !== index) : prev[field],
    }))
  }

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  const filledIngredients = form.ingredients.filter((i) => i.trim())
  const canSubmit = form.title.trim() && filledIngredients.length > 0

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setShowPreview(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const filledSteps = form.steps.filter((s) => s.trim())
      await saveRecipe({
        data: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          ingredients: filledIngredients.map((i) => i.trim()),
          steps: filledSteps.length > 0 ? filledSteps.map((s) => s.trim()) : undefined,
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

        <div>
          <span className="text-sm font-medium">Ingredienser *</span>
          <div className="mt-1 space-y-2">
            {form.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={ingredient}
                  onChange={(e) => updateListItem('ingredients', index, e.target.value)}
                  placeholder={`Ingrediens ${index + 1}, t.ex. 400g spaghetti`}
                />
                {form.ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListItem('ingredients', index)}
                  >
                    Ta bort
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => addListItem('ingredients')}>
              + Lägg till ingrediens
            </Button>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Steg</span>
          <div className="mt-1 space-y-2">
            {form.steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <span className="mt-2 text-sm text-gray-400">{index + 1}.</span>
                  <Input
                    value={step}
                    onChange={(e) => updateListItem('steps', index, e.target.value)}
                    placeholder={`Steg ${index + 1}`}
                  />
                </div>
                {form.steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListItem('steps', index)}
                  >
                    Ta bort
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => addListItem('steps')}>
              + Lägg till steg
            </Button>
          </div>
        </div>

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
  const filledIngredients = form.ingredients.filter((i) => i.trim())
  const filledSteps = form.steps.filter((s) => s.trim())

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
