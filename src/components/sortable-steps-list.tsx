import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { SortableStepItem } from '#/components/sortable-step-item'
import { Input } from '#/components/ui/input'

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import type { AnyFieldApi } from '@tanstack/react-form'

type SortableStepsListProps = {
  stepsField: AnyFieldApi
  form: { Field: React.ComponentType<any> }
}

let nextStableId = 0
const generateId = () => `step-${nextStableId++}`

const SortableStepsList = ({ stepsField, form }: SortableStepsListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const stableIdsRef = useRef<string[] | null>(null)
  const steps = stepsField.state.value as string[]

  if (stableIdsRef.current === null) {
    stableIdsRef.current = steps.map(() => generateId())
  }

  while (stableIdsRef.current.length < steps.length) {
    stableIdsRef.current.push(generateId())
  }
  if (stableIdsRef.current.length > steps.length) {
    stableIdsRef.current = stableIdsRef.current.slice(0, steps.length)
  }

  const ids = stableIdsRef.current

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  const activeIndex = activeId ? ids.indexOf(activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))

    stableIdsRef.current = arrayMove(ids, oldIndex, newIndex)
    stepsField.setValue(arrayMove(steps, oldIndex, newIndex))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {steps.map((_, index) => (
            <SortableStepItem
              key={ids[index]}
              id={ids[index]}
              index={index}
              form={form}
              stepsField={stepsField}
              canDelete={steps.length > 1}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeIndex !== null && (
          <div className="flex gap-2 rounded-xl border border-plum-200 bg-white p-2 shadow-lg">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-sm font-bold tabular-nums text-plum-600">
                {activeIndex + 1}.
              </span>
              <Input
                value={steps[activeIndex]}
                readOnly
                tabIndex={-1}
              />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export { SortableStepsList }
