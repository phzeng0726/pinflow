import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface SortableChecklistItemProps {
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

export function SortableChecklistItem(props: SortableChecklistItemProps) {
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

  const handleToggle = (checked: boolean | 'indeterminate') => {
    onToggle(checked === true)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEditSave()
    }
    if (e.key === 'Escape') {
      onEditCancel()
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditChange(e.target.value)
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
        onCheckedChange={handleToggle}
      />
      {isEditing ? (
        <Input
          value={editItemValue}
          onChange={handleEditChange}
          onBlur={onEditSave}
          onKeyDown={handleEditKeyDown}
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
