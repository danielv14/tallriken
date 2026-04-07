import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getIsAuthenticated } from '#/auth/server'
import { fetchAllTags, addTag, updateTagName, removeTag } from '#/tags/server'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'

export const Route = createFileRoute('/admin/tags')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: () => fetchAllTags(),
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Hantera taggar</h1>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleAddTag} className="mt-6 flex gap-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Ny tagg..."
        />
        <Button type="submit">Lägg till</Button>
      </form>

      <ul className="mt-6 divide-y divide-gray-100">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center gap-3 py-3">
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
                <Button size="sm" onClick={() => handleRename(tag.id)}>
                  Spara
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Avbryt
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1">{tag.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(tag.id, tag.name)}
                >
                  Byt namn
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget({ id: tag.id, name: tag.name })}
                >
                  Ta bort
                </Button>
              </>
            )}
          </li>
        ))}
        {tags.length === 0 && (
          <li className="py-3 text-gray-500">Inga taggar ännu.</li>
        )}
      </ul>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Ta bort tagg"
        description={`Är du säker på att du vill ta bort "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
      />
    </main>
  )
}
