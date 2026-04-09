import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useChatStore } from '#/chat/store'
import { useCopyToClipboard } from '#/hooks/use-copy-to-clipboard'
import { getIsAuthenticated } from '#/auth/server'
import { fetchRecipeById, removeRecipe } from '#/recipes/server'
import { generateAndSaveImage, uploadImageForRecipe } from '#/images/server'
import { fetchMenuRecipeIds, addRecipeToMenu, removeRecipeFromMenu } from '#/menu/server'
import { ImagePicker } from '#/components/image-picker'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ArrowLeftIcon,
  ClockIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CalendarIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/recipes/$recipeId')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login', search: { error: undefined } })
    }
  },
  loader: async ({ params }) => {
    const [recipe, menuRecipeIds] = await Promise.all([
      fetchRecipeById({ data: { id: parseInt(params.recipeId, 10) } }),
      fetchMenuRecipeIds(),
    ])
    if (!recipe) {
      throw new Error('Receptet hittades inte')
    }
    return { recipe, menuRecipeIds }
  },
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const { recipe, menuRecipeIds } = Route.useLoaderData()
  const navigate = useNavigate()
  const setPageContext = useChatStore((s) => s.setPageContext)
  const { copied, copy: copyToClipboard } = useCopyToClipboard()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(recipe.imageUrl)
  const [inMenu, setInMenu] = useState(menuRecipeIds.includes(recipe.id))

  useEffect(() => {
    setPageContext({ type: 'recipe', recipeId: recipe.id, recipeTitle: recipe.title })
    return () => setPageContext({ type: 'other' })
  }, [recipe.id, recipe.title, setPageContext])

  const handleCopyIngredients = async () => {
    const text = recipe.ingredients
      .map((g) => {
        const header = g.group ? `${g.group}\n` : ''
        return header + g.items.join('\n')
      })
      .join('\n\n')
    await copyToClipboard(text)
  }

  const handleGenerateImage = async (): Promise<string> => {
    const result = await generateAndSaveImage({ data: { recipeId: recipe.id } })
    return result.imageUrl
  }

  const handleUploadImage = async (base64: string, mimeType: string): Promise<string> => {
    const result = await uploadImageForRecipe({ data: { recipeId: recipe.id, base64, mimeType } })
    return result.imageUrl
  }

  const handleToggleMenu = async () => {
    if (inMenu) {
      setInMenu(false)
      await removeRecipeFromMenu({ data: { recipeId: recipe.id } })
    } else {
      setInMenu(true)
      await addRecipeToMenu({ data: { recipeId: recipe.id } })
    }
  }

  const handleDelete = async () => {
    await removeRecipe({ data: { id: recipe.id } })
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen">
      {/* Compact header */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
          {/* Recipe image */}
          <ImagePicker
            imageUrl={currentImageUrl ?? undefined}
            onImageChange={(url) => setCurrentImageUrl(url ?? null)}
            onUpload={handleUploadImage}
            onGenerate={handleGenerateImage}
            variant="banner"
          />

          <div className="p-6">
          {/* Title & meta */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{recipe.title}</h1>
            {recipe.description && (
              <p className="mt-2 leading-relaxed text-gray-500">{recipe.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {recipe.cookingTimeMinutes && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  {recipe.cookingTimeMinutes} min
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  {recipe.servings} portioner
                </span>
              )}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-plum-600 hover:text-plum-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  Källa
                </a>
              )}
            </div>
            {recipe.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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

            {/* Actions */}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                onClick={handleToggleMenu}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  inMenu
                    ? 'text-plum-600 hover:bg-plum-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                {inMenu ? 'I veckans meny' : 'Lägg till i menyn'}
              </button>
              <Link to="/recipes/edit/$recipeId" params={{ recipeId: String(recipe.id) }}>
                <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-700">
                  <PencilSquareIcon className="h-4 w-4" />
                  Redigera
                </button>
              </Link>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Ta bort
              </button>
            </div>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Ingredients */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Ingredienser</h2>
              <button
                onClick={handleCopyIngredients}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                    Kopierat
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Kopiera
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 space-y-4">
              {recipe.ingredients.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.group && (
                    <h3 className="mb-2 text-sm font-bold text-gray-600">{group.group}</h3>
                  )}
                  <ul className="space-y-2">
                    {group.items.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-base text-gray-700">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-plum-400" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <>
              <hr className="my-6 border-gray-100" />
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Tillagning</h2>
                <ol className="mt-3 space-y-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-base leading-relaxed text-gray-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Ta bort recept"
        description={`Är du säker på att du vill ta bort "${recipe.title}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
