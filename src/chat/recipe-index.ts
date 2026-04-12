import type { getAllRecipes } from '#/recipes/crud'

type RecipeWithTags = Awaited<ReturnType<typeof getAllRecipes>>[number]

export const buildRecipeIndex = (recipes: RecipeWithTags[]): string => {
  if (recipes.length === 0) return 'Receptsamlingen är tom.'

  const lines = recipes.map((r) => {
    const meta: string[] = []
    if (r.cookingTimeMinutes != null) meta.push(`${r.cookingTimeMinutes} min`)
    if (r.servings != null) meta.push(`${r.servings} port`)
    const tags = r.tags.map((t) => t.name)
    if (tags.length > 0) meta.push(tags.join(', '))

    const ingredients = r.ingredients
      .flatMap((g) => g.items)
      .join(', ')

    const parts = [`#${r.id} ${r.title}`]
    if (meta.length > 0) parts[0] += ` (${meta.join(' | ')})`
    parts[0] += ` /recipes/${r.id}`

    if (r.description) parts.push(`  ${r.description}`)
    if (ingredients) parts.push(`  Ingredienser: ${ingredients}`)

    const stats: string[] = []
    if (r.cookCount > 0) {
      stats.push(`lagat ${r.cookCount} ggr`)
      if (r.lastCookedAt) stats.push(`senast ${r.lastCookedAt.toISOString().slice(0, 10)}`)
    }
    if (stats.length > 0) parts.push(`  ${stats.join(', ')}`)

    return parts.join('\n')
  })

  return lines.join('\n\n')
}
