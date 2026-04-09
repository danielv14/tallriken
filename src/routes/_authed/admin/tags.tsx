import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { fetchAllTags, addTag, updateTagName, removeTag } from '#/tags/server'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import {
  ArrowLeftIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_authed/admin/tags')({
  loader: () => fetchAllTags(),
  head: () => ({ meta: [{ title: 'Taggar | Tallriken' }] }),
  component: TagsAdminPage,
})

function TagsAdminPage() {
  const tags = Route.useLoaderData()
  const [newTagName, setNewTagName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTagName.trim()
    if (!trimmed) return

    try {
      await addTag({ data: { name: trimmed } })
      setNewTagName('')
      setError(null)
      window.location.reload()
    } catch {
      setError('Kunde inte skapa taggen. Kanske den redan finns?')
    }
  }

  const handleRename = async (id: number) => {
    const trimmed = editingName.trim()
    if (!trimmed) return

    try {
      await updateTagName({ data: { id, name: trimmed } })
      setEditingId(null)
      setError(null)
      window.location.reload()
    } catch {
      setError('Kunde inte byta namn. Kanske namnet redan finns?')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await removeTag({ data: { id: deleteTarget.id } })
      setDeleteTarget(null)
      window.location.reload()
    } catch {
      setError('Kunde inte ta bort taggen.')
    }
  }

  const startEditing = (id: number, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800">
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Hantera taggar</h1>

        {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleAddTag} className="mt-6 flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Ny tagg..."
            />
          </div>
          <Button type="submit" className="shrink-0">Lägg till</Button>
        </form>

        <div className="mt-6 rounded-xl bg-white ring-1 ring-gray-100">
          <ul className="divide-y divide-gray-50">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === tag.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(tag.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleRename(tag.id)}>Spara</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Avbryt</Button>
                  </>
                ) : (
                  <>
                    <TagIcon className="h-4 w-4 shrink-0 text-plum-400" />
                    <span className="flex-1 text-sm font-medium text-gray-700">{tag.name}</span>
                    <button
                      onClick={() => startEditing(tag.id, tag.name)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: tag.id, name: tag.name })}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
            {tags.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-400">
                Inga taggar ännu.
              </li>
            )}
          </ul>
        </div>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          title="Ta bort tagg"
          description={`Är du säker på att du vill ta bort "${deleteTarget?.name}"?`}
          onConfirm={handleDelete}
        />
      </main>
    </div>
  )
}
