import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { triggerBackfill } from '#/vector/server'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const VectorsAdminPage = () => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  const handleBackfill = async () => {
    setStatus('loading')
    setResult(null)
    try {
      const response = await triggerBackfill()
      setStatus('success')
      setResult(`${response.total} recept embeddade`)
    } catch {
      setStatus('error')
      setResult('Något gick fel vid backfill')
    }
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
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Vektorsök</h1>
        <p className="mt-2 text-sm text-gray-500">
          Hantera vektordatabasen som driver semantisk sökning. Kör backfill efter att du synkat receptdata till prod.
        </p>

        <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Backfill embeddings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Genererar nya embeddings för alla recept. Befintliga vektorer skrivs över.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={status === 'loading'}
            >
              <ArrowPathIcon className={`mr-1.5 h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              {status === 'loading' ? 'Kör backfill...' : 'Kör backfill'}
            </Button>
          </div>

          {result && (
            <div className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {result}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Kör backfill"
        description="Detta genererar nya embeddings för alla recept via OpenAI. Det kan ta en stund beroende på antal recept."
        confirmLabel="Kör backfill"
        confirmVariant="primary"
        onConfirm={handleBackfill}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authed/admin/vectors')({
  head: () => ({ meta: [{ title: 'Vektorsök | Tallriken' }] }),
  component: VectorsAdminPage,
})
