export type IngredientGroup = {
  group: string | null
  items: string[]
}

export type IngredientGroupFormData = {
  group: string
  items: string[]
}

export type RecipeFormData = {
  title: string
  description: string
  ingredientGroups: IngredientGroupFormData[]
  steps: string[]
  cookingTimeMinutes: string
  servings: string
  tagIds: number[]
}

export type RecipeInput = {
  title: string
  description?: string
  ingredients: IngredientGroup[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  tagIds: number[]
}
