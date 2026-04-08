import { AlertDialog } from '@base-ui/react/alert-dialog'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '#/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ta bort',
  onConfirm,
}: ConfirmDialogProps) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <AlertDialog.Title className="text-base font-bold text-gray-900">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-gray-500">
                {description}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Close
              render={<Button variant="ghost">Avbryt</Button>}
            />
            <Button
              variant="danger"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export { ConfirmDialog }
