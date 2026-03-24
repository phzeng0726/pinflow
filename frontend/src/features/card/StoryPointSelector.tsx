import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import type { Card } from '@/types'
import { Flame, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { cn } from '../../lib/utils'

const STORY_POINTS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

interface StoryPointSelectorProps {
  boardId: number
  card: Card
}

export function StoryPointSelector(props: StoryPointSelectorProps) {
  const { boardId, card } = props

  const { updateCard } = useCardMutations(boardId)

  const handleChange = (sp: number | null) => {
    if (!card) return
    updateCard.mutate({
      id: card.id,
      form: {
        title: card.title,
        description: card.description,
        storyPoint: sp ?? undefined,
        startTime: card.startTime ?? undefined,
        endTime: card.endTime ?? undefined,
      },
    })
  }

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Flame className="h-4 w-4" /> Story Point
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {STORY_POINTS.map((sp) => (
          <Button
            key={sp}
            type="button"
            variant={card.storyPoint === sp ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleChange(card.storyPoint === sp ? null : sp)}
            className={cn(
              'h-7 w-9 text-xs font-medium',
              card.storyPoint === sp &&
                'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
            )}
          >
            {sp}
          </Button>
        ))}
        {card.storyPoint != null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChange(null)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
