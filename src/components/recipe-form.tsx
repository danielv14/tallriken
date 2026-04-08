import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { PlusIcon, XMarkIcon, SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { generateImageFromDetails, uploadRecipeImage } from '#/images/server'

import { type RecipeFormData, type IngredientGroupFormData, EMPTY_FORM_DATA } from '#/recipes/form-utils'
export type { RecipeFormData } from '#/recipes/form-utils'
export { EMPTY_FORM_DATA as EMPTY_FORM } from '#/recipes/form-utils'

type RecipeFormProps = {
  initialData?: RecipeFormData
  initialImageUrl?: string
  tags: { id: number; name: string }[]
  onSubmit: (data: RecipeFormData, imageUrl?: string) => void
  submitLabel: string
  onCancel: () => void
}

const RecipeForm = ({ initialData, initialImageUrl, tags, onSubmit, submitLabel, onCancel }: RecipeFormProps) => {
  const [form, setForm] = useState<RecipeFormData>(initialData ?? EMPTY_FORM_DATA)
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const updateField = (field: 'title' | 'description' | 'cookingTimeMinutes' | 'servings', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Ingredient group helpers
  const updateGroupName = (groupIndex: number, name: string) => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: prev.ingredientGroups.map((g, i) =>
        i === groupIndex ? { ...g, group: name } : g,
      ),
    }))
  }

  const updateIngredient = (groupIndex: number, itemIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: prev.ingredientGroups.map((g, i) =>
        i === groupIndex
          ? { ...g, items: g.items.map((item, j) => (j === itemIndex ? value : item)) }
          : g,
      ),
    }))
  }

  const addIngredient = (groupIndex: number) => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: prev.ingredientGroups.map((g, i) =>
        i === groupIndex ? { ...g, items: [...g.items, ''] } : g,
      ),
    }))
  }

  const removeIngredient = (groupIndex: number, itemIndex: number) => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: prev.ingredientGroups.map((g, i) =>
        i === groupIndex && g.items.length > 1
          ? { ...g, items: g.items.filter((_, j) => j !== itemIndex) }
          : g,
      ),
    }))
  }

  const addGroup = () => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: [...prev.ingredientGroups, { group: '', items: [''] }],
    }))
  }

  const removeGroup = (groupIndex: number) => {
    setForm((prev) => ({
      ...prev,
      ingredientGroups: prev.ingredientGroups.length > 1
        ? prev.ingredientGroups.filter((_, i) => i !== groupIndex)
        : prev.ingredientGroups,
    }))
  }

  // Step helpers
  const updateStep = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? value : s)),
    }))
  }

  const addStep = () => {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, ''] }))
  }

  const removeStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.length > 1 ? prev.steps.filter((_, i) => i !== index) : prev.steps,
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

  const hasFilledIngredients = form.ingredientGroups.some((g) =>
    g.items.some((i) => i.trim()),
  )
  const canSubmit = form.title.trim() && hasFilledIngredients

  const handleGenerateImage = async () => {
    setGeneratingImage(true)
    try {
      const result = await generateImageFromDetails({
        data: { title: form.title.trim(), description: form.description.trim() || undefined },
      })
      setImageUrl(result.imageUrl)
    } catch (err) {
      console.error('Image generation failed:', err)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await uploadRecipeImage({ data: { base64, mimeType: file.type } })
      setImageUrl(result.imageUrl)
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(form, imageUrl)
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
        <div className="mt-2 space-y-4">
          {form.ingredientGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={form.ingredientGroups.length > 1 ? 'rounded-lg border border-gray-200 p-3' : ''}>
              {form.ingredientGroups.length > 1 && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Gruppnamn</label>
                    <Input
                      value={group.group}
                      onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                      placeholder="T.ex. Deg, Fyllning, Sås..."
                      className="font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((ingredient, itemIndex) => (
                  <div key={itemIndex} className="flex gap-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => updateIngredient(groupIndex, itemIndex, e.target.value)}
                      placeholder={`Ingrediens ${itemIndex + 1}, t.ex. 400g spaghetti`}
                    />
                    {group.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(groupIndex, itemIndex)}
                        className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addIngredient(groupIndex)}
                  className="flex items-center gap-1.5 text-sm font-medium text-plum-600 transition hover:text-plum-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Lägg till ingrediens
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addGroup}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            <PlusIcon className="h-4 w-4" />
            Lägg till ingrediensgrupp
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
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`Steg ${index + 1}`}
                />
              </div>
              {form.steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
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

      {/* Image */}
      <div>
        <span className="text-sm font-semibold text-gray-700">Bild</span>
        <div className="mt-2">
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-lg">
              <img src={imageUrl} alt="Receptbild" className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="absolute right-2 top-2 rounded-lg bg-white/90 p-1 text-gray-500 shadow-sm hover:bg-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                <PhotoIcon className="h-4 w-4" />
                {uploadingImage ? 'Laddar upp...' : 'Ladda upp bild'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadImage(file)
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || !canSubmit}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
              >
                <SparklesIcon className="h-4 w-4" />
                {generatingImage ? 'Genererar...' : 'Generera med AI'}
              </button>
            </div>
          )}
        </div>
      </div>

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
