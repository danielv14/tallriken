import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ImagePicker } from '#/components/image-picker'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { generateImageFromDetails, uploadRecipeImage } from '#/images/server'
import { Recipe, recipeFormSchema } from '#/recipes/recipe'

import type { RecipeFormData } from '#/recipes/recipe'
import type { AnyFieldApi } from '@tanstack/react-form'
export type { RecipeFormData } from '#/recipes/recipe'

type RecipeFormProps = {
  initialData?: RecipeFormData
  initialImageUrl?: string
  tags: { id: number; name: string }[]
  onSubmit: (data: RecipeFormData, imageUrl?: string) => void
  submitLabel: string
  onCancel: () => void
}

type FormTab = 'basics' | 'ingredients' | 'steps'

const TAB_FIELDS: Record<FormTab, string[]> = {
  basics: ['title', 'description', 'cookingTimeMinutes', 'servings', 'tagIds'],
  ingredients: ['ingredientGroups'],
  steps: ['steps'],
}

// Only show errors from the onChange bucket to avoid stale errors from other event sources
const getOnChangeErrors = (field: AnyFieldApi): string[] => {
  const error = field.state.meta.errorMap.onChange
  if (!error) return []
  if (typeof error === 'string') return [error]
  if (Array.isArray(error)) return error.map((e) => (typeof e === 'string' ? e : e?.message ?? '')).filter(Boolean)
  return []
}

const hasFieldError = (field: AnyFieldApi) =>
  field.state.meta.isTouched && getOnChangeErrors(field).length > 0

const FieldError = ({ field }: { field: AnyFieldApi }) => {
  if (!hasFieldError(field)) return null
  return (
    <p className="mt-1 text-xs text-red-500">
      {getOnChangeErrors(field).join(', ')}
    </p>
  )
}

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-sm font-semibold text-gray-700">
    {children} <span className="text-red-500">*</span>
  </span>
)

type TabButtonProps = {
  label: string
  active: boolean
  hasError: boolean
  onClick: () => void
}

export const TabButton = ({ label, active, hasError, onClick }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition ${
      active
        ? 'border-plum-600 text-plum-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    {label}
    {hasError && (
      <span className="h-2 w-2 rounded-full bg-red-500" />
    )}
  </button>
)

const RecipeForm = ({ initialData, initialImageUrl, tags, onSubmit, submitLabel, onCancel }: RecipeFormProps) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl)
  const [activeTab, setActiveTab] = useState<FormTab>('basics')

  const form = useForm({
    defaultValues: initialData ?? Recipe.empty(),
    validators: {
      onChange: recipeFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value, imageUrl)
    },
  })

  const getTabErrors = (fieldMeta: Record<string, { errorMap?: { onChange?: unknown } }>) => {
    const tabHasError = (tab: FormTab) =>
      TAB_FIELDS[tab].some((fieldName) => {
        return Object.entries(fieldMeta).some(
          ([key, meta]) => key.startsWith(fieldName) && meta.errorMap?.onChange,
        )
      })

    return {
      basics: tabHasError('basics'),
      ingredients: tabHasError('ingredients'),
      steps: tabHasError('steps'),
    }
  }

  const navigateToFirstTabWithError = () => {
    const fieldMeta = form.state.fieldMeta as Record<string, { errorMap?: { onChange?: unknown } }>
    const errors = getTabErrors(fieldMeta)
    const tabOrder: FormTab[] = ['basics', 'ingredients', 'steps']
    const firstErrorTab = tabOrder.find((tab) => errors[tab])
    if (firstErrorTab) {
      setActiveTab(firstErrorTab)
    }
  }

  const handleGenerateImage = async (): Promise<string> => {
    const title = form.getFieldValue('title')
    const description = form.getFieldValue('description')
    const result = await generateImageFromDetails({
      data: { title: title.trim(), description: description.trim() || undefined },
    })
    return result.imageUrl
  }

  const handleUploadImage = async (base64: string, mimeType: string): Promise<string> => {
    const result = await uploadRecipeImage({ data: { base64, mimeType } })
    return result.imageUrl
  }

  const handleFormSubmit = async () => {
    // Touch all fields so errors become visible
    await form.validateAllFields('change')
    // Run form-level schema validator with 'change' cause so errors land in
    // errorMap.onChange - the same bucket that clears reactively as the user types
    await form.validate('change')

    if (!form.state.isValid) {
      navigateToFirstTabWithError()
      return
    }

    onSubmit(form.state.values, imageUrl)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleFormSubmit()
      }}
      className="space-y-5"
    >
      {/* Tabs */}
      <form.Subscribe
        selector={(state) => state.fieldMeta}
        children={(fieldMeta) => {
          const errors = getTabErrors(fieldMeta as Record<string, { errorMap?: { onChange?: unknown } }>)
          return (
            <div className="flex gap-4 border-b border-gray-200">
              <TabButton
                label="Grundinfo"
                active={activeTab === 'basics'}
                hasError={errors.basics}
                onClick={() => setActiveTab('basics')}
              />
              <TabButton
                label="Ingredienser"
                active={activeTab === 'ingredients'}
                hasError={errors.ingredients}
                onClick={() => setActiveTab('ingredients')}
              />
              <TabButton
                label="Steg"
                active={activeTab === 'steps'}
                hasError={errors.steps}
                onClick={() => setActiveTab('steps')}
              />
            </div>
          )
        }}
      />

      {/* Basics tab */}
      <div className={activeTab === 'basics' ? 'space-y-5' : 'hidden'}>
        <form.Field
          name="title"
          children={(field) => (
            <label className="block">
              <RequiredLabel>Titel</RequiredLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="T.ex. Pasta Carbonara"
                hasError={hasFieldError(field)}
              />
              <FieldError field={field} />
            </label>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Beskrivning</span>
              <Textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Kort beskrivning av rätten..."
                rows={2}
              />
            </label>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="cookingTimeMinutes"
            children={(field) => (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Tillagningstid (min)</span>
                <Input
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="T.ex. 30"
                  min="1"
                  hasError={hasFieldError(field)}
                />
                <FieldError field={field} />
              </label>
            )}
          />

          <form.Field
            name="servings"
            children={(field) => (
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Portioner</span>
                <Input
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="T.ex. 4"
                  min="1"
                  hasError={hasFieldError(field)}
                />
                <FieldError field={field} />
              </label>
            )}
          />
        </div>

        {tags.length > 0 && (
          <form.Field
            name="tagIds"
            children={(field) => (
              <div>
                <span className="text-sm font-semibold text-gray-700">Taggar</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const current = field.state.value
                        field.handleChange(
                          current.includes(tag.id)
                            ? current.filter((id) => id !== tag.id)
                            : [...current, tag.id],
                        )
                      }}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        field.state.value.includes(tag.id)
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
          />
        )}

        <div>
          <span className="text-sm font-semibold text-gray-700">Bild</span>
          <div className="mt-2">
            <ImagePicker
              imageUrl={imageUrl}
              onImageChange={setImageUrl}
              onUpload={handleUploadImage}
              onGenerate={handleGenerateImage}
              canGenerate={!!form.getFieldValue('title').trim()}
            />
          </div>
        </div>
      </div>

      {/* Ingredients tab */}
      <div className={activeTab === 'ingredients' ? '' : 'hidden'}>
        <form.Field
          name="ingredientGroups"
          mode="array"
          children={(ingredientGroupsField) => (
            <div>
              <RequiredLabel>Ingredienser</RequiredLabel>
              {hasFieldError(ingredientGroupsField) && (
                <FieldError field={ingredientGroupsField} />
              )}
              <div className="mt-2 space-y-4">
                {ingredientGroupsField.state.value.map((_, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={
                      ingredientGroupsField.state.value.length > 1
                        ? 'rounded-lg border border-gray-200 p-3'
                        : ''
                    }
                  >
                    {ingredientGroupsField.state.value.length > 1 && (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-semibold text-gray-500">Gruppnamn</label>
                          <form.Field
                            name={`ingredientGroups[${groupIndex}].group`}
                            children={(field) => (
                              <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="T.ex. Deg, Fyllning, Sås..."
                                className="font-medium"
                              />
                            )}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => ingredientGroupsField.removeValue(groupIndex)}
                          className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <form.Field
                      name={`ingredientGroups[${groupIndex}].items`}
                      mode="array"
                      children={(itemsField) => (
                        <div className="space-y-2">
                          {itemsField.state.value.map((_, itemIndex) => (
                            <div key={itemIndex} className="flex gap-2">
                              <form.Field
                                name={`ingredientGroups[${groupIndex}].items[${itemIndex}]`}
                                children={(field) => (
                                  <Input
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                    placeholder={`Ingrediens ${itemIndex + 1}, t.ex. 400g spaghetti`}
                                  />
                                )}
                              />
                              {itemsField.state.value.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => itemsField.removeValue(itemIndex)}
                                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => itemsField.pushValue('')}
                            className="flex items-center gap-1.5 text-sm font-medium text-plum-600 transition hover:text-plum-700"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Lägg till ingrediens
                          </button>
                        </div>
                      )}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => ingredientGroupsField.pushValue({ group: '', items: [''] })}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Lägg till ingrediensgrupp
                </button>
              </div>
            </div>
          )}
        />
      </div>

      {/* Steps tab */}
      <div className={activeTab === 'steps' ? '' : 'hidden'}>
        <form.Field
          name="steps"
          mode="array"
          children={(stepsField) => (
            <div>
              <RequiredLabel>Steg</RequiredLabel>
              {hasFieldError(stepsField) && (
                <FieldError field={stepsField} />
              )}
              <div className="mt-2 space-y-2">
                {stepsField.state.value.map((_, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="shrink-0 text-sm font-bold tabular-nums text-plum-600">
                        {index + 1}.
                      </span>
                      <form.Field
                        name={`steps[${index}]`}
                        children={(field) => (
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder={`Steg ${index + 1}`}
                          />
                        )}
                      />
                    </div>
                    {stepsField.state.value.length > 1 && (
                      <button
                        type="button"
                        onClick={() => stepsField.removeValue(index)}
                        className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => stepsField.pushValue('')}
                  className="flex items-center gap-1.5 text-sm font-medium text-plum-600 transition hover:text-plum-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Lägg till steg
                </button>
              </div>
            </div>
          )}
        />
      </div>

      {/* Submit - always enabled, validation happens on submit */}
      <div className="flex gap-2 pt-2">
        <Button type="submit">
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
