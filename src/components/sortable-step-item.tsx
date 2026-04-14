import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '#/components/ui/input'
import { XMarkIcon } from '@heroicons/react/24/outline'

import type { AnyFieldApi } from '@tanstack/react-form'

type SortableStepItemProps = {
  id: string
  index: number
  form: { Field: React.ComponentType<any> }
  stepsField: AnyFieldApi
  canDelete: boolean
}

const DragHandle = () => (
  <button
    type="button"
    className="touch-none shrink-0 cursor-grab rounded p-1 text-gray-400 transition hover:text-plum-600 active:cursor-grabbing"
    aria-label="Dra för att ändra ordning"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  </button>
)

const SortableStepItem = ({
  id,
  index,
  form,
  stepsField,
  canDelete,
}: SortableStepItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'z-10 opacity-50' : ''}`}
    >
      <div {...attributes} {...listeners}>
        <DragHandle />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-sm font-bold tabular-nums text-plum-600">
          {index + 1}.
        </span>
        <form.Field
          name={`steps[${index}]`}
          children={(field: AnyFieldApi) => (
            <Input
              value={field.state.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              onBlur={field.handleBlur}
              placeholder={`Steg ${index + 1}`}
            />
          )}
        />
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={() => stepsField.removeValue(index)}
          className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export { SortableStepItem }
