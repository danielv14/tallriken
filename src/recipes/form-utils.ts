export type RecipeFormData = {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTimeMinutes: string
  servings: string
  tagIds: number[]
}

export type RecipeInput = {
  title: string
  description?: string
  ingredients: string[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  tagIds: number[]
}

export const EMPTY_FORM_DATA: RecipeFormData = {
  title: '',
  description: '',
  ingredients: [''],
  steps: [''],
  cookingTimeMinutes: '',
  servings: '',
  tagIds: [],
}

export const formDataToRecipeInput = (form: RecipeFormData): RecipeInput => {
  const filledIngredients = form.ingredients
    .map((i) => i.trim())
    .filter(Boolean)
  const filledSteps = form.steps
    .map((s) => s.trim())
    .filter(Boolean)
  const description = form.description.trim()
  const cookingTimeMinutes = form.cookingTimeMinutes ? parseInt(form.cookingTimeMinutes, 10) : undefined
  const servings = form.servings ? parseInt(form.servings, 10) : undefined

  return {
    title: form.title.trim(),
    description: description || undefined,
    ingredients: filledIngredients,
    steps: filledSteps.length > 0 ? filledSteps : undefined,
    cookingTimeMinutes,
    servings,
    tagIds: form.tagIds,
  }
}

type RecipeWithTags = {
  title: string
  description: string | null
  ingredients: string[]
  steps: string[] | null
  cookingTimeMinutes: number | null
  servings: number | null
  tags: { id: number; name: string }[]
}

export const recipeToFormData = (recipe: RecipeWithTags): RecipeFormData => {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
    steps: recipe.steps && recipe.steps.length > 0 ? recipe.steps : [''],
    cookingTimeMinutes: recipe.cookingTimeMinutes ? String(recipe.cookingTimeMinutes) : '',
    servings: recipe.servings ? String(recipe.servings) : '',
    tagIds: recipe.tags.map((t) => t.id),
  }
}
