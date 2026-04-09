import { z } from 'zod'

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

const ingredientGroupFormSchema = z.object({
  group: z.string(),
  items: z.array(z.string()),
})

export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Titel krävs'),
  description: z.string(),
  ingredientGroups: z
    .array(ingredientGroupFormSchema)
    .refine(
      (groups) => groups.some((g) => g.items.some((item) => item.trim().length > 0)),
      { message: 'Minst en ingrediens krävs' },
    ),
  steps: z.array(z.string()),
  cookingTimeMinutes: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) > 0), {
      message: 'Måste vara ett positivt heltal',
    }),
  servings: z
    .string()
    .refine((v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) > 0), {
      message: 'Måste vara ett positivt heltal',
    }),
  tagIds: z.array(z.number()),
})
