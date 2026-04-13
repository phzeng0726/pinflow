import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { cn } from '@/lib/utils'
import { PRIORITIES } from '@/pages/board-detail/components/styleConfig'
import type { Card } from '@/types'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface PriorityPopoverProps {
  boardId: number
  card: Card
}

export function PriorityPopover(props: PriorityPopoverProps) {
  const { boardId, card } = props
  const [open, setOpen] = useState(false)
  const { updateCard } = useCardMutations(boardId)

  const handleSelect = (value: number) => {
    const newPriority = card.priority === value ? 0 : value
    updateCard.mutate({
      id: card.id,
      form: { priority: newPriority },
    })
    setOpen(false)
  }

  const handleRemove = () => {
    updateCard.mutate({
      id: card.id,
      form: { priority: 0 },
    })
    setOpen(false)
  }

  const hasValue = card.priority != null && card.priority > 0
  const activePriority = PRIORITIES.find((p) => p.value === card.priority)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={hasValue ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-8 px-2 text-xs font-medium',
            hasValue && activePriority?.activeClass,
          )}
        >
          {hasValue ? activePriority?.label : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Priority
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 py-3">
          <div className="flex flex-col gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleSelect(p.value)}
                className={cn(
                  'flex h-8 w-full items-center rounded px-2 text-xs font-medium transition-colors',
                  card.priority === p.value
                    ? p.activeClass
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                )}
              >
                <span className="mr-2 font-bold">P{p.value}</span>
                {p.label}
              </button>
            ))}
          </div>
          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-2 w-full rounded py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
            >
              REMOVE
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
