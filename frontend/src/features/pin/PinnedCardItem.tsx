import { PinOff } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'
import type { PinnedCard } from '../../types'

const COLUMN_COLORS = [
  'border-red-400',
  'border-orange-400',
  'border-blue-400',
  'border-green-400',
  'border-blue-400',
  'border-purple-400',
]

interface PinnedCardItemProps {
  card: PinnedCard
  onUnpin: (id: number) => void
}

export function PinnedCardItem(props: PinnedCardItemProps) {
  const { card, onUnpin } = props

  const colorClass = COLUMN_COLORS[card.columnId % COLUMN_COLORS.length]
  const truncatedDesc =
    card.description.length > 100
      ? card.description.slice(0, 100) + '…'
      : card.description

  return (
    <div
      className={cn(
        'group relative rounded-lg border-l-4 bg-white px-3 py-2 dark:bg-gray-800',
        colorClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {card.title}
          </p>
          {truncatedDesc && (
            <p className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400">
              {truncatedDesc}
            </p>
          )}
          <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {card.columnName}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="取消釘選"
              className="mt-0.5 h-6 w-6 shrink-0 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
              onClick={() => onUnpin(card.id)}
            >
              <PinOff className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>取消釘選</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
