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

const STORY_POINTS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

interface StoryPointPopoverProps {
  boardId: number
  card: Card
}

export function StoryPointPopover(props: StoryPointPopoverProps) {
  const { boardId, card } = props
  const [open, setOpen] = useState(false)
  const { updateCard } = useCardMutations(boardId)

  const handleSelect = (sp: number) => {
    const newSp = card.storyPoint === sp ? 0 : sp
    updateCard.mutate({
      id: card.id,
      form: {
        title: card.title,
        description: card.description,
        storyPoint: newSp,
        startTime: card.startTime ?? undefined,
        endTime: card.endTime ?? undefined,
      },
    })
    setOpen(false)
  }

  const handleRemove = () => {
    updateCard.mutate({
      id: card.id,
      form: {
        title: card.title,
        description: card.description,
        storyPoint: 0,
        startTime: card.startTime ?? undefined,
        endTime: card.endTime ?? undefined,
      },
    })
    setOpen(false)
  }

  const hasValue = card.storyPoint != null && card.storyPoint > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={hasValue ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-8 min-w-[2rem] px-2 text-xs font-medium',
            hasValue &&
              'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
          )}
        >
          {hasValue ? card.storyPoint : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="start">
        <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          Story Points
        </p>
        <div className="grid grid-cols-5 gap-1">
          {STORY_POINTS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => handleSelect(sp)}
              className={cn(
                'flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors',
                card.storyPoint === sp
                  ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
              )}
            >
              {sp}
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
