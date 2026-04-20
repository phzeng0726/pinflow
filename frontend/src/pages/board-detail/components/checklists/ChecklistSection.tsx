import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCardDetail } from '@/hooks/card/queries/useCardDetail'
import { useChecklistMutations } from '@/hooks/checklist/mutations/useChecklistMutations'
import { useChecklistBlockDnd } from '@/hooks/checklist/useChecklistBlockDnd'
import { createChecklistSchema, type ChecklistFormData } from '@/lib/schemas'
import type { Modifier } from '@dnd-kit/core'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckSquare, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ChecklistBlock } from './ChecklistBlock'

const shiftLeft: Modifier = ({ transform }) => ({
  ...transform,
  x: transform.x - 280,
})

interface ChecklistSectionProps {
  boardId: number
  cardId: number
}

export function ChecklistSection(props: ChecklistSectionProps) {
  const { boardId, cardId } = props
  const { data: card } = useCardDetail(cardId)
  if (!card) return null
  const { t } = useTranslation()
  const checklistSchema = useMemo(() => createChecklistSchema(t), [t])

  const [showNewForm, setShowNewForm] = useState(false)
  const { createChecklist, moveChecklist } = useChecklistMutations(
    boardId,
    card.id,
  )
  const { sensors, activeChecklist, handleDragStart, handleDragEnd } =
    useChecklistBlockDnd({
      card,
      moveMutate: moveChecklist.mutate,
    })

  const sortedChecklists = [...card.checklists].sort(
    (a, b) => a.position - b.position,
  )

  const { register, handleSubmit, reset } = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
  })

  const onSubmit = (data: ChecklistFormData) => {
    createChecklist.mutate(data.title, {
      onSuccess: () => {
        reset()
        setShowNewForm(false)
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      reset()
      setShowNewForm(false)
    }
  }

  const handleCancel = () => {
    reset()
    setShowNewForm(false)
  }

  const handleShowForm = () => setShowNewForm(true)

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <CheckSquare className="h-4 w-4" /> {t('checklist.title')}
      </Label>

      <DndContext
        id={`checklist-section-dnd-${card.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedChecklists.map((cl) => `checklist-${cl.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedChecklists.map((cl) => (
              <ChecklistBlock
                key={cl.id}
                boardId={boardId}
                checklist={cl}
                cardId={card.id}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null} modifiers={[shiftLeft]}>
          {activeChecklist && (
            <div className="cursor-grabbing rounded-lg border bg-white p-3 opacity-95 shadow-2xl dark:border-gray-600 dark:bg-gray-700">
              <p className="select-none text-sm font-medium text-gray-900 dark:text-gray-100">
                {activeChecklist.title}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showNewForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 flex gap-2">
          <Input
            {...register('title')}
            onKeyDown={handleKeyDown}
            placeholder={t('checklist.listNamePlaceholder')}
            className="h-8 text-sm"
            autoFocus
          />
          <Button type="submit" className="h-8 text-xs">
            {t('checklist.add')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 text-xs"
          >
            {t('checklist.cancel')}
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          onClick={handleShowForm}
          className="mt-3 h-8 text-xs text-gray-500"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> {t('checklist.addChecklist')}
        </Button>
      )}
    </div>
  )
}
