import { z } from 'zod'
import type { recipesTable } from '#/db/schema'
import type { RecipeDraft } from '#/import/schema'

// ── Types ──────────────────────────────────────────────────────────

export type IngredientGroup = {
  group: string | null
  items: string[]
}

export type RecipeInput = {
  title: string
  description?: string
  ingredients: IngredientGroup[]
  steps?: string[]
  cookingTimeMinutes?: number
  servings?: number
  sourceUrl?: string
  imageUrl?: string
  tagIds: number[]
}

type IngredientGroupFormData = {
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

export type DbRecipe = typeof recipesTable.$inferSelect & {
  tags: { id: number; name: string }[]
}

// ── Schemas ────────────────────────────────────────────────────────

const ingredientGroupSchema = z.object({
  group: z.string().nullable(),
  items: z.array(z.string().min(1)).min(1),
})

export const recipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(ingredientGroupSchema).min(1),
  steps: z.array(z.string().min(1)).optional(),
  cookingTimeMinutes: z.number().positive().optional(),
  servings: z.number().positive().optional(),
  tagIds: z.array(z.number()),
  sourceUrl: z.string().optional(),
  imageUrl: z.string().optional(),
})

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
  steps: z
    .array(z.string())
    .refine((steps) => steps.some((s) => s.trim().length > 0), {
      message: 'Minst ett steg krävs',
    }),
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

// ── Converters ─────────────────────────────────────────────────────

type NullableRecipeCore = {
  title: string
  description: string | null
  ingredients: IngredientGroup[]
  steps: string[] | null
  cookingTimeMinutes: number | null
  servings: number | null
}

type NullableRecipeFields = NullableRecipeCore & { tagIds: number[] }

type RecipeWithTags = NullableRecipeCore & {
  tags: { id: number; name: string }[]
}

const nullableToForm = (source: NullableRecipeFields): RecipeFormData => {
  const ingredientGroups: IngredientGroupFormData[] =
    source.ingredients.length > 0
      ? source.ingredients.map((g) => ({
          group: g.group ?? '',
          items: g.items.length > 0 ? g.items : [''],
        }))
      : [{ group: '', items: [''] }]

  return {
    title: source.title,
    description: source.description ?? '',
    ingredientGroups,
    steps: source.steps && source.steps.length > 0 ? source.steps : [''],
    cookingTimeMinutes: source.cookingTimeMinutes
      ? String(source.cookingTimeMinutes)
      : '',
    servings: source.servings ? String(source.servings) : '',
    tagIds: source.tagIds,
  }
}

export const Recipe = {
  fromForm: (form: RecipeFormData): RecipeInput => {
    const ingredients = form.ingredientGroups
      .map((g) => ({
        group: g.group.trim() || null,
        items: g.items.map((i) => i.trim()).filter(Boolean),
      }))
      .filter((g) => g.items.length > 0)

    const filledSteps = form.steps.map((s) => s.trim()).filter(Boolean)
    const description = form.description.trim()
    const cookingTimeMinutes = form.cookingTimeMinutes
      ? parseInt(form.cookingTimeMinutes, 10)
      : undefined
    const servings = form.servings ? parseInt(form.servings, 10) : undefined

    return {
      title: form.title.trim(),
      description: description || undefined,
      ingredients,
      steps: filledSteps.length > 0 ? filledSteps : undefined,
      cookingTimeMinutes,
      servings,
      tagIds: form.tagIds,
    }
  },

  toForm: (recipe: RecipeWithTags): RecipeFormData =>
    nullableToForm({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      cookingTimeMinutes: recipe.cookingTimeMinutes,
      servings: recipe.servings,
      tagIds: recipe.tags.map((t) => t.id),
    }),

  fromDraft: (draft: RecipeDraft & { tagIds: number[] }): RecipeFormData =>
    nullableToForm({
      title: draft.title,
      description: draft.description,
      ingredients: draft.ingredients,
      steps: draft.steps,
      cookingTimeMinutes: draft.cookingTimeMinutes,
      servings: draft.servings,
      tagIds: draft.tagIds,
    }),

  empty: (): RecipeFormData => ({
    title: '',
    description: '',
    ingredientGroups: [{ group: '', items: [''] }],
    steps: [''],
    cookingTimeMinutes: '',
    servings: '',
    tagIds: [],
  }),
} as const
