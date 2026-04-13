import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'
import { Plus } from 'lucide-react'
import { useState } from 'react'

const PRIORITIES = [
  {
    value: 1,
    label: 'Highest',
    activeClass:
      'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600',
  },
  {
    value: 2,
    label: 'Critical',
    activeClass:
      'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600',
  },
  {
    value: 3,
    label: 'High',
    activeClass:
      'bg-yellow-400 text-white hover:bg-yellow-500 dark:bg-yellow-400 dark:hover:bg-yellow-500',
  },
  {
    value: 4,
    label: 'Medium',
    activeClass:
      'bg-green-500 text-white hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600',
  },
  {
    value: 5,
    label: 'Low',
    activeClass:
      'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600',
  },
]

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
      <PopoverContent className="w-44 p-3" align="start">
        <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          Priority
        </p>
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
      </PopoverContent>
    </Popover>
  )
}
