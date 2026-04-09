import type {
  RecipeFormData,
  IngredientGroupFormData,
  IngredientGroup,
  RecipeInput,
} from '#/recipes/form-utils'

type RecipeWithTags = {
  title: string
  description: string | null
  ingredients: IngredientGroup[]
  steps: string[] | null
  cookingTimeMinutes: number | null
  servings: number | null
  tags: { id: number; name: string }[]
}

type ExtractedDraft = {
  title: string
  description: string | null
  ingredients: IngredientGroup[]
  steps: string[] | null
  cookingTimeMinutes: number | null
  servings: number | null
  tagIds: number[]
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

  toForm: (recipe: RecipeWithTags): RecipeFormData => {
    const ingredientGroups: IngredientGroupFormData[] =
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((g) => ({
            group: g.group ?? '',
            items: g.items.length > 0 ? g.items : [''],
          }))
        : [{ group: '', items: [''] }]

    return {
      title: recipe.title,
      description: recipe.description ?? '',
      ingredientGroups,
      steps: recipe.steps && recipe.steps.length > 0 ? recipe.steps : [''],
      cookingTimeMinutes: recipe.cookingTimeMinutes
        ? String(recipe.cookingTimeMinutes)
        : '',
      servings: recipe.servings ? String(recipe.servings) : '',
      tagIds: recipe.tags.map((t) => t.id),
    }
  },

  fromDraft: (draft: ExtractedDraft): RecipeFormData => {
    const ingredientGroups: IngredientGroupFormData[] =
      draft.ingredients.length > 0
        ? draft.ingredients.map((g) => ({
            group: g.group ?? '',
            items: g.items.length > 0 ? g.items : [''],
          }))
        : [{ group: '', items: [''] }]

    return {
      title: draft.title,
      description: draft.description ?? '',
      ingredientGroups,
      steps: draft.steps && draft.steps.length > 0 ? draft.steps : [''],
      cookingTimeMinutes: draft.cookingTimeMinutes
        ? String(draft.cookingTimeMinutes)
        : '',
      servings: draft.servings ? String(draft.servings) : '',
      tagIds: draft.tagIds,
    }
  },

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
