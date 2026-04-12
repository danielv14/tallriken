import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useChatStore } from '#/chat/store'
import { CopyButton } from '#/components/copy-button'
import { PageShell } from '#/components/page-shell'
import { fetchRecipeById, removeRecipe } from '#/recipes/server'
import { generateAndSaveImage, uploadImageForRecipe } from '#/images/server'
import { fetchMenuRecipeIds, addRecipeToMenu, removeRecipeFromMenu } from '#/menu/server'
import { ImagePicker } from '#/components/image-picker'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/ui/dropdown-menu'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ClockIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'

const RecipeDetailPage = () => {
  const { recipe, menuRecipeIds } = Route.useLoaderData()
  const navigate = useNavigate()
  const setPageContext = useChatStore((s) => s.setPageContext)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(recipe.imageUrl)
  const [inMenu, setInMenu] = useState(menuRecipeIds.includes(recipe.id))

  useEffect(() => {
    setPageContext({ type: 'recipe', recipeId: recipe.id, recipeTitle: recipe.title })
    return () => setPageContext({ type: 'other' })
  }, [recipe.id, recipe.title, setPageContext])

  const ingredientsText = recipe.ingredients
    .map((g) => {
      const header = g.group ? `${g.group}\n` : ''
      return header + g.items.join('\n')
    })
    .join('\n\n')

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
    <PageShell to="/">
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
          <ImagePicker
            imageUrl={currentImageUrl ?? undefined}
            onImageChange={(url) => setCurrentImageUrl(url ?? null)}
            onUpload={handleUploadImage}
            onGenerate={handleGenerateImage}
            variant="banner"
          />

          <div className="p-6">
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{recipe.title}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger className="mt-1 shrink-0">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-48">
                  <DropdownMenuItem onClick={handleToggleMenu}>
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {inMenu ? 'Ta bort från veckomenyn' : 'Lägg till i veckomenyn'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: '/recipes/edit/$recipeId', params: { recipeId: String(recipe.id) } })}
                  >
                    <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                    Redigera
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 data-highlighted:bg-red-50"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Ta bort
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {recipe.description && (
              <p className="mt-2 leading-relaxed text-gray-500">{recipe.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {recipe.cookingTimeMinutes && (
                <span className="flex items-center gap-1.5 text-sm tabular-nums text-gray-500">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  {recipe.cookingTimeMinutes} min
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5 text-sm tabular-nums text-gray-500">
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

          </div>

          <hr className="my-6 border-gray-100" />

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Ingredienser</h2>
              <CopyButton text={ingredientsText} />
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

          {recipe.steps && recipe.steps.length > 0 && (
            <>
              <hr className="my-6 border-gray-100" />
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Tillagning</h2>
                <ol className="mt-3 space-y-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 text-sm font-bold tabular-nums text-plum-600">
                        {i + 1}.
                      </span>
                      <p className="text-base leading-relaxed text-gray-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
          </div>
        </div>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Ta bort recept"
        description={`Är du säker på att du vill ta bort "${recipe.title}"?`}
        onConfirm={handleDelete}
      />
    </PageShell>
  )
}

export const Route = createFileRoute('/_authed/recipes/$recipeId')({
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
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.recipe.title} | Tallriken` }] }),
  component: RecipeDetailPage,
})
