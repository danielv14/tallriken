import { z } from 'zod'

export const recipeDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  ingredients: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).nullable(),
  cookingTimeMinutes: z.number().positive().nullable(),
  servings: z.number().positive().nullable(),
  suggestedTagNames: z.array(z.string()).nullable(),
})

export type RecipeDraft = z.infer<typeof recipeDraftSchema>
