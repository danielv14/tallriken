import { useState } from 'react'
import type { RecipeFormData } from '#/recipes/form-utils'
import { Recipe } from '#/recipes/types'

export const useRecipeForm = (initialData?: RecipeFormData) => {
  const [form, setForm] = useState<RecipeFormData>(initialData ?? Recipe.empty())

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

  return {
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
    hasFilledIngredients,
    canSubmit,
  }
}
