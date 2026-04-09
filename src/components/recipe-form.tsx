import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ImagePicker } from '#/components/image-picker'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { generateImageFromDetails, uploadRecipeImage } from '#/images/server'
import { useRecipeForm } from '#/hooks/use-recipe-form'

import type { RecipeFormData } from '#/recipes/form-utils'
import type { IngredientGroupFormData } from '#/recipes/form-utils'
export type { RecipeFormData } from '#/recipes/form-utils'

type RecipeFormProps = {
  initialData?: RecipeFormData
  initialImageUrl?: string
  tags: { id: number; name: string }[]
  onSubmit: (data: RecipeFormData, imageUrl?: string) => void
  submitLabel: string
  onCancel: () => void
}

// --- Sub-components (tightly coupled to form, kept in same file) ---

type IngredientGroupEditorProps = {
  ingredientGroups: IngredientGroupFormData[]
  updateGroupName: (groupIndex: number, name: string) => void
  updateIngredient: (groupIndex: number, itemIndex: number, value: string) => void
  addIngredient: (groupIndex: number) => void
  removeIngredient: (groupIndex: number, itemIndex: number) => void
  addGroup: () => void
  removeGroup: (groupIndex: number) => void
}

const IngredientGroupEditor = ({
  ingredientGroups,
  updateGroupName,
  updateIngredient,
  addIngredient,
  removeIngredient,
  addGroup,
  removeGroup,
}: IngredientGroupEditorProps) => {
  return (
    <div>
      <span className="text-sm font-semibold text-gray-700">Ingredienser *</span>
      <div className="mt-2 space-y-4">
        {ingredientGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={ingredientGroups.length > 1 ? 'rounded-lg border border-gray-200 p-3' : ''}>
            {ingredientGroups.length > 1 && (
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
  )
}

type StepEditorProps = {
  steps: string[]
  updateStep: (index: number, value: string) => void
  addStep: () => void
  removeStep: (index: number) => void
}

const StepEditor = ({ steps, updateStep, addStep, removeStep }: StepEditorProps) => {
  return (
    <div>
      <span className="text-sm font-semibold text-gray-700">Steg</span>
      <div className="mt-2 space-y-2">
        {steps.map((step, index) => (
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
            {steps.length > 1 && (
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
  )
}

// --- Main form component ---

const RecipeForm = ({ initialData, initialImageUrl, tags, onSubmit, submitLabel, onCancel }: RecipeFormProps) => {
  const {
    form,
    updateField,
    updateGroupName,
    updateIngredient,
    addIngredient,
    removeIngredient,
    addGroup,
    removeGroup,
    updateStep,
    addStep,
    removeStep,
    toggleTag,
    canSubmit,
  } = useRecipeForm(initialData)

  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl)

  const handleGenerateImage = async (): Promise<string> => {
    const result = await generateImageFromDetails({
      data: { title: form.title.trim(), description: form.description.trim() || undefined },
    })
    return result.imageUrl
  }

  const handleUploadImage = async (base64: string, mimeType: string): Promise<string> => {
    const result = await uploadRecipeImage({ data: { base64, mimeType } })
    return result.imageUrl
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

      <IngredientGroupEditor
        ingredientGroups={form.ingredientGroups}
        updateGroupName={updateGroupName}
        updateIngredient={updateIngredient}
        addIngredient={addIngredient}
        removeIngredient={removeIngredient}
        addGroup={addGroup}
        removeGroup={removeGroup}
      />

      <StepEditor
        steps={form.steps}
        updateStep={updateStep}
        addStep={addStep}
        removeStep={removeStep}
      />

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
          <ImagePicker
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            onUpload={handleUploadImage}
            onGenerate={handleGenerateImage}
            canGenerate={!!canSubmit}
          />
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
