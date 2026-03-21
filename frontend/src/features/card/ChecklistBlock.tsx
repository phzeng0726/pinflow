import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Progress } from '../../components/ui/progress'
import { useChecklistMutations } from '../../hooks/checklist/mutations/useChecklistMutations'
import { checklistItemSchema } from '../../lib/schemas'
import { cn } from '../../lib/utils'
import type { Checklist } from '../../types'

type ChecklistItemForm = z.infer<typeof checklistItemSchema>

interface ChecklistBlockProps {
  boardId: number
  checklist: Checklist
  cardId: number
}

export function ChecklistBlock(props: ChecklistBlockProps) {
  const { boardId, checklist, cardId } = props

  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const {
    deleteChecklist,
    createChecklistItem: createItem,
    updateChecklistItem: updateItem,
    deleteChecklistItem: deleteItem,
  } = useChecklistMutations(boardId, cardId)

  const newItemForm = useForm<ChecklistItemForm>({
    resolver: zodResolver(checklistItemSchema),
  })

  const editForm = useForm<ChecklistItemForm>({
    resolver: zodResolver(checklistItemSchema),
  })

  const completedCount = checklist.items?.filter((i) => i.completed).length ?? 0
  const total = checklist.items?.length ?? 0
  const progress = total > 0 ? (completedCount / total) * 100 : 0

  const handleAddItem = async (data: ChecklistItemForm) => {
    await createItem.mutateAsync({ checklistId: checklist.id, text: data.text })
    newItemForm.reset()
    setShowItemForm(false)
  }

  const handleEditSave = async (itemId: number, data: ChecklistItemForm) => {
    await updateItem.mutateAsync({ id: itemId, data: { text: data.text } })
    setEditingItemId(null)
  }

  return (
    <div className="rounded-lg border p-3 dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {checklist.title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {completedCount}/{total}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={() => deleteChecklist.mutate(checklist.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {total > 0 && <Progress value={progress} className="mb-3 h-1.5" />}
      <div className="space-y-1.5">
        {(checklist.items ?? []).map((item) => (
          <div key={item.id} className="group flex items-center gap-2">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) =>
                updateItem.mutate({
                  id: item.id,
                  data: { completed: checked === true },
                })
              }
            />
            {editingItemId === item.id ? (
              <form
                onSubmit={editForm.handleSubmit((data) =>
                  handleEditSave(item.id, data),
                )}
                className="flex flex-1 gap-1"
              >
                <Input
                  {...editForm.register('text')}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingItemId(null)
                  }}
                  className="h-7 flex-1 text-sm"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-500"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Label
                className={cn(
                  'flex-1 cursor-pointer text-sm font-normal',
                  item.completed
                    ? 'text-gray-400 line-through dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300',
                )}
                onClick={() => {
                  setEditingItemId(item.id)
                  editForm.reset({ text: item.text })
                }}
              >
                {item.text}
              </Label>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
              onClick={() => deleteItem.mutate(item.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
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
            placeholder="新增項目..."
            className="h-7 flex-1 text-sm"
            autoFocus
          />
          <Button type="submit" className="h-7 text-xs">
            新增
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
            取消
          </Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowItemForm(true)}
          className="mt-2 h-7 px-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Plus className="mr-1 h-3 w-3" /> 新增項目
        </Button>
      )}
    </div>
  )
}
