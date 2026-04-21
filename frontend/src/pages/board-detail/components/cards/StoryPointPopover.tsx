import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { cn } from '@/lib/utils'
import { STORY_POINTS } from '@/lib/styleConfig'
import type { Card } from '@/types'
import { Flame, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface StoryPointPopoverProps {
  boardId: number
  card: Card
}

export function StoryPointPopover(props: StoryPointPopoverProps) {
  const { boardId, card } = props
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
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

  const handleClose = () => setOpen(false)

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
          {hasValue ? card.storyPoint : <Flame className="h-3.5 w-3.5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('storyPoint.title')}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 py-3">
          <div className="grid grid-cols-5 gap-1">
            {STORY_POINTS.map((sp) => {
              const handleSelectSP = () => handleSelect(sp)
              return (
                <button
                  key={sp}
                  type="button"
                  onClick={handleSelectSP}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors',
                    card.storyPoint === sp
                      ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                  )}
                >
                  {sp}
                </button>
              )
            })}
          </div>
          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-2 w-full rounded py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
            >
              {t('common.remove')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
