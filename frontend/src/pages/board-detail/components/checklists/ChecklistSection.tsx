import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCardDetail } from '@/hooks/card/queries/useCardDetail'
import { useChecklistMutations } from '@/hooks/checklist/mutations/useChecklistMutations'
import { useChecklistDnd } from '@/hooks/dnd/useChecklistDnd'
import { createChecklistSchema, type ChecklistFormData } from '@/lib/schemas'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckSquare, Plus } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ChecklistBlock } from './ChecklistBlock'

interface ChecklistSectionProps {
  boardId: number
  cardId: number
}

export function ChecklistSection({ boardId, cardId }: ChecklistSectionProps) {
  const { data: card } = useCardDetail(cardId)
  const { t } = useTranslation()
  const checklistSchema = useMemo(() => createChecklistSchema(t), [t])
  const containerRef = useRef<HTMLDivElement>(null)

  const dialogOffsetModifier = useCallback<Modifier>(({ transform }) => {
    const dialog = containerRef.current?.closest('[role="dialog"]')
    if (!dialog) return transform
    const rect = dialog.getBoundingClientRect()
    return {
      ...transform,
      x: transform.x - rect.left,
      y: transform.y - rect.top,
    }
  }, [])

  const overlayModifiers = useMemo(
    () => [dialogOffsetModifier],
    [dialogOffsetModifier],
  )

  const [showNewForm, setShowNewForm] = useState(false)
  const { createChecklist, moveChecklist, moveChecklistItem } =
    useChecklistMutations(boardId, card?.id ?? 0)

  const sortedChecklists = useMemo(
    () => [...(card?.checklists ?? [])].sort((a, b) => a.position - b.position),
    [card?.checklists],
  )

  const {
    sensors,
    activeChecklist,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useChecklistDnd({
    card: card ?? null,
    sortedChecklists,
    moveChecklistMutate: moveChecklist.mutate,
    moveItemMutate: moveChecklistItem.mutate,
  })

  const { register, handleSubmit, reset } = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
  })

  if (!card) return null

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

  return (
    <div ref={containerRef}>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <CheckSquare className="h-4 w-4" /> {t('checklist.title')}
      </Label>

      <DndContext
        id={`checklist-dnd-${card.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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

        <DragOverlay dropAnimation={null} modifiers={overlayModifiers}>
          {activeChecklist && (
            <div className="cursor-grabbing rounded-lg border bg-white p-3 opacity-95 shadow-2xl dark:border-gray-600 dark:bg-gray-700">
              <p className="select-none text-sm font-medium text-gray-900 dark:text-gray-100">
                {activeChecklist.title}
              </p>
            </div>
          )}
          {activeItem && (
            <div className="flex cursor-grabbing items-center gap-2 rounded border bg-white px-2 py-1 opacity-95 shadow-lg dark:border-gray-600 dark:bg-gray-700">
              <input
                type="checkbox"
                checked={activeItem.completed}
                readOnly
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="select-none text-sm text-gray-800 dark:text-gray-200">
                {activeItem.text}
              </span>
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
            onClick={() => {
              reset()
              setShowNewForm(false)
            }}
            className="h-8 text-xs"
          >
            {t('checklist.cancel')}
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowNewForm(true)}
          className="mt-3 h-8 text-xs text-gray-500"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> {t('checklist.addChecklist')}
        </Button>
      )}
    </div>
  )
}
