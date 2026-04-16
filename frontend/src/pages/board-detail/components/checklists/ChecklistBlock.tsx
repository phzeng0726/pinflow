import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { useChecklistDnd } from '@/hooks/checklist/useChecklistDnd'
import { useChecklistMutations } from '@/hooks/checklist/mutations/useChecklistMutations'
import { createChecklistItemSchema, type ChecklistItemFormData } from '@/lib/schemas'
import type { Checklist } from '@/types'
import { SortableChecklistItem } from './SortableChecklistItem'

interface ChecklistBlockProps {
  boardId: number
  checklist: Checklist
  cardId: number
}

export function ChecklistBlock(props: ChecklistBlockProps) {
  const { boardId, checklist, cardId } = props
  const { t } = useTranslation()
  const checklistItemSchema = useMemo(() => createChecklistItemSchema(t), [t])

  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editItemValue, setEditItemValue] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(checklist.title)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `checklist-${checklist.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const { sensors, handleChecklistDragEnd } = useChecklistDnd({
    boardId,
    cardId,
    checklists: [checklist],
  })

  const {
    updateChecklist,
    deleteChecklist,
    createChecklistItem: createItem,
    updateChecklistItem: updateItem,
    deleteChecklistItem: deleteItem,
  } = useChecklistMutations(boardId, cardId)

  const handleTitleSave = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== checklist.title) {
      updateChecklist.mutate({ id: checklist.id, data: { title: trimmed } })
    } else {
      setTitleValue(checklist.title)
    }
    setEditingTitle(false)
  }

  const handleItemTextSave = (itemId: number, originalText: string) => {
    const trimmed = editItemValue.trim()
    if (trimmed && trimmed !== originalText) {
      updateItem.mutate({ id: itemId, data: { text: trimmed } })
    }
    setEditingItemId(null)
  }

  const newItemForm = useForm<ChecklistItemFormData>({
    resolver: zodResolver(checklistItemSchema),
  })

  const completedCount = checklist.items?.filter((i) => i.completed).length ?? 0
  const total = checklist.items?.length ?? 0
  const progress = total > 0 ? (completedCount / total) * 100 : 0

  const handleAddItem = (data: ChecklistItemFormData) => {
    createItem.mutate(
      { checklistId: checklist.id, text: data.text },
      {
        onSuccess: () => {
          newItemForm.reset()
          setShowItemForm(false)
        },
      },
    )
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave()
    }
    if (e.key === 'Escape') {
      setTitleValue(checklist.title)
      setEditingTitle(false)
    }
  }

  const handleStartEditTitle = () => {
    setTitleValue(checklist.title)
    setEditingTitle(true)
  }

  const handleCancelDelete = () => setDeleteOpen(false)

  const handleConfirmDelete = () => {
    deleteChecklist.mutate(checklist.id)
    setDeleteOpen(false)
  }

  const handleItemInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      newItemForm.reset()
      setShowItemForm(false)
    }
  }

  const handleCancelItemForm = () => {
    newItemForm.reset()
    setShowItemForm(false)
  }

  const handleShowItemForm = () => setShowItemForm(true)

  const sortedItems = [...(checklist.items ?? [])].sort(
    (a, b) => a.position - b.position,
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border p-3 dark:border-gray-700"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-1 items-center gap-1">
          <button
            type="button"
            className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="h-7 flex-1 text-sm font-medium"
              autoFocus
            />
          ) : (
            <span
              className="cursor-pointer text-sm font-medium text-gray-800 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
              onClick={handleStartEditTitle}
            >
              {checklist.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {completedCount}/{total}
          </span>
          <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                {t('confirm.deleteChecklistTitle')}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCancelDelete}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleConfirmDelete}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {total > 0 && <Progress value={progress} className="mb-3 h-1.5" />}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChecklistDragEnd}
      >
        <SortableContext
          items={sortedItems.map((item) => `checklist-item-${item.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {sortedItems.map((item) => {
              const handleEditStart = () => {
                setEditingItemId(item.id)
                setEditItemValue(item.text)
              }
              const handleEditSave = () => handleItemTextSave(item.id, item.text)
              const handleEditCancel = () => {
                setEditItemValue(item.text)
                setEditingItemId(null)
              }
              const handleToggle = (checked: boolean) =>
                updateItem.mutate({ id: item.id, data: { completed: checked } })
              const handleDelete = () => deleteItem.mutate(item.id)
              return (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  isEditing={editingItemId === item.id}
                  editItemValue={editItemValue}
                  onEditStart={handleEditStart}
                  onEditChange={setEditItemValue}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
      {showItemForm ? (
        <form
          onSubmit={newItemForm.handleSubmit(handleAddItem)}
          className="mt-2 flex gap-2"
        >
          <Input
            {...newItemForm.register('text')}
            onKeyDown={handleItemInputKeyDown}
            placeholder={t('checklist.addItemPlaceholder')}
            className="h-7 flex-1 text-sm"
            autoFocus
          />
          <Button type="submit" className="h-7 text-xs">
            {t('checklist.add')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancelItemForm}
            className="h-7 text-xs"
          >
            {t('checklist.cancel')}
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowItemForm}
          className="mt-2 h-7 px-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Plus className="mr-1 h-3 w-3" /> {t('checklist.addItem')}
        </Button>
      )}
    </div>
  )
}
