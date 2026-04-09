import { Link } from '@tanstack/react-router'
import {
  ClockIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

type RecipeCardProps = {
  recipe: {
    id: number
    title: string
    description: string | null
    imageUrl: string | null
    cookingTimeMinutes: number | null
    servings: number | null
    tags: { id: number; name: string }[]
  }
  isInMenu: boolean
  onToggleMenu: (e: React.MouseEvent, recipeId: number) => void
}

const RecipeCard = ({ recipe, isInMenu, onToggleMenu }: RecipeCardProps) => {
  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: String(recipe.id) }}
      className="group overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 transition hover:ring-plum-200 hover:shadow-md"
    >
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="aspect-[16/10] w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-gray-900 group-hover:text-plum-600">{recipe.title}</h2>
          <button
            onClick={(e) => onToggleMenu(e, recipe.id)}
            className={`shrink-0 rounded-lg p-1.5 transition ${
              isInMenu
                ? 'text-plum-600 bg-plum-50'
                : 'text-gray-300 hover:text-plum-500 hover:bg-plum-50'
            }`}
            title={isInMenu ? 'Ta bort från veckans meny' : 'Lägg till i veckans meny'}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{recipe.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {recipe.cookingTimeMinutes && (
            <span className="flex items-center gap-1 text-xs tabular-nums text-gray-400">
              <ClockIcon className="h-3.5 w-3.5" />
              {recipe.cookingTimeMinutes} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1 text-xs tabular-nums text-gray-400">
              <UsersIcon className="h-3.5 w-3.5" />
              {recipe.servings} portioner
            </span>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export { RecipeCard }
