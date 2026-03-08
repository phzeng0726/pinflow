import { PinOff } from 'lucide-react'
import type { PinnedCard } from '../../types'

const COLUMN_COLORS = [
  'border-red-400', 'border-orange-400', 'border-yellow-400',
  'border-green-400', 'border-blue-400', 'border-purple-400',
]

interface PinnedCardItemProps {
  card: PinnedCard
  onUnpin: (id: number) => void
}

export function PinnedCardItem({ card, onUnpin }: PinnedCardItemProps) {
  const colorClass = COLUMN_COLORS[card.column_id % COLUMN_COLORS.length]
  const truncatedDesc = card.description.length > 100
    ? card.description.slice(0, 100) + '…'
    : card.description

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-l-4 ${colorClass} px-3 py-2 group relative`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug">{card.title}</p>
          {truncatedDesc && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{truncatedDesc}</p>
          )}
          <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            {card.column_name}
          </span>
        </div>
        <button
          onClick={() => onUnpin(card.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0 mt-0.5"
          title="取消釘選"
        >
          <PinOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
