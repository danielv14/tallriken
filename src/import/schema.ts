import { z } from 'zod'

export const recipeDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).optional(),
  cookingTimeMinutes: z.number().positive().optional(),
  servings: z.number().positive().optional(),
  suggestedTagNames: z.array(z.string()).optional(),
})

export type RecipeDraft = z.infer<typeof recipeDraftSchema>
