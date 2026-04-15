import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { useChecklistDnd } from '@/hooks/checklist/useChecklistDnd'
import { useChecklistMutations } from '@/hooks/checklist/mutations/useChecklistMutations'
import { createChecklistItemSchema, type ChecklistItemFormData } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import type { Checklist } from '@/types'

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

  const handleAddItem = async (data: ChecklistItemFormData) => {
    await createItem.mutateAsync({ checklistId: checklist.id, text: data.text })
    newItemForm.reset()
    setShowItemForm(false)
  }

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
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTitleSave()
                }
                if (e.key === 'Escape') {
                  setTitleValue(checklist.title)
                  setEditingTitle(false)
                }
              }}
              className="h-7 flex-1 text-sm font-medium"
              autoFocus
            />
          ) : (
            <span
              className="cursor-pointer text-sm font-medium text-gray-800 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
              onClick={() => {
                setTitleValue(checklist.title)
                setEditingTitle(true)
              }}
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
                  onClick={() => setDeleteOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    deleteChecklist.mutate(checklist.id)
                    setDeleteOpen(false)
                  }}
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
            {sortedItems.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                editItemValue={editItemValue}
                onEditStart={() => {
                  setEditingItemId(item.id)
                  setEditItemValue(item.text)
                }}
                onEditChange={setEditItemValue}
                onEditSave={() => handleItemTextSave(item.id, item.text)}
                onEditCancel={() => {
                  setEditItemValue(item.text)
                  setEditingItemId(null)
                }}
                onToggle={(checked) =>
                  updateItem.mutate({
                    id: item.id,
                    data: { completed: checked },
                  })
                }
                onDelete={() => deleteItem.mutate(item.id)}
              />
            ))}
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
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                newItemForm.reset()
                setShowItemForm(false)
              }
            }}
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
            onClick={() => {
              newItemForm.reset()
              setShowItemForm(false)
            }}
            className="h-7 text-xs"
          >
            {t('checklist.cancel')}
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowItemForm(true)}
          className="mt-2 h-7 px-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Plus className="mr-1 h-3 w-3" /> {t('checklist.addItem')}
        </Button>
      )}
    </div>
  )
}

interface SortableChecklistItemProps {
  item: { id: number; text: string; completed: boolean; position: number }
  isEditing: boolean
  editItemValue: string
  onEditStart: () => void
  onEditChange: (value: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onToggle: (checked: boolean) => void
  onDelete: () => void
}

function SortableChecklistItem(props: SortableChecklistItemProps) {
  const {
    item,
    isEditing,
    editItemValue,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onToggle,
    onDelete,
  } = props

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `checklist-item-${item.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2"
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 opacity-0 hover:text-gray-600 group-hover:opacity-100 dark:hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      {isEditing ? (
        <Input
          value={editItemValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEditSave()
            }
            if (e.key === 'Escape') {
              onEditCancel()
            }
          }}
          className="h-7 flex-1 text-sm"
          autoFocus
        />
      ) : (
        <Label
          className={cn(
            'flex-1 cursor-pointer text-sm font-normal',
            item.completed
              ? 'text-gray-400 line-through dark:text-gray-500'
              : 'text-gray-700 dark:text-gray-300',
          )}
          onClick={onEditStart}
        >
          {item.text}
        </Label>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
