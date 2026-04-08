import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type RecipeFormData = {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTimeMinutes: string
  servings: string
  tagIds: number[]
}

type RecipeFormProps = {
  initialData?: RecipeFormData
  tags: { id: number; name: string }[]
  onSubmit: (data: RecipeFormData) => void
  submitLabel: string
  onCancel: () => void
}

export const EMPTY_FORM: RecipeFormData = {
  title: '',
  description: '',
  ingredients: [''],
  steps: [''],
  cookingTimeMinutes: '',
  servings: '',
  tagIds: [],
}

const RecipeForm = ({ initialData, tags, onSubmit, submitLabel, onCancel }: RecipeFormProps) => {
  const [form, setForm] = useState<RecipeFormData>(initialData ?? EMPTY_FORM)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-gray-700">Titel *</span>
        <Input
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="T.ex. Pasta Carbonara"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-700">Beskrivning</span>
        <Textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Kort beskrivning av rätten..."
          rows={2}
        />
      </label>

      <div>
        <span className="text-sm font-semibold text-gray-700">Ingredienser *</span>
        <div className="mt-2 space-y-2">
          {form.ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={ingredient}
                onChange={(e) => updateListItem('ingredients', index, e.target.value)}
                placeholder={`Ingrediens ${index + 1}, t.ex. 400g spaghetti`}
              />
              {form.ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('ingredients', index)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem('ingredients')}
            className="flex items-center gap-1.5 text-sm font-medium text-plum-600 transition hover:text-plum-700"
          >
            <PlusIcon className="h-4 w-4" />
            Lägg till ingrediens
          </button>
        </div>
      </div>

      <div>
        <span className="text-sm font-semibold text-gray-700">Steg</span>
        <div className="mt-2 space-y-2">
          {form.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-600 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <Input
                  value={step}
                  onChange={(e) => updateListItem('steps', index, e.target.value)}
                  placeholder={`Steg ${index + 1}`}
                />
              </div>
              {form.steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem('steps', index)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem('steps')}
            className="flex items-center gap-1.5 text-sm font-medium text-plum-600 transition hover:text-plum-700"
          >
            <PlusIcon className="h-4 w-4" />
            Lägg till steg
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Tillagningstid (min)</span>
          <Input
            type="number"
            value={form.cookingTimeMinutes}
            onChange={(e) => updateField('cookingTimeMinutes', e.target.value)}
            placeholder="T.ex. 30"
            min="1"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Portioner</span>
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
          <span className="text-sm font-semibold text-gray-700">Taggar</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  form.tagIds.includes(tag.id)
                    ? 'bg-plum-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={!canSubmit}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}

export { RecipeForm }
