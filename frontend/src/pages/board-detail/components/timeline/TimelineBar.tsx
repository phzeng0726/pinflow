import { getCardUrgency } from '@/lib/dates'
import { getColumnColor } from '@/lib/styleConfig'
import { useTimelineStore } from '@/stores/timelineStore'
import type { Card } from '@/types'
import type { BarProps } from './useTimelineData'
import { ROW_HEIGHT } from './useTimelineData'

interface TimelineBarProps {
  card: Card
  barProps: BarProps
  rowIndex: number
  columnId: number | null
  matchesSearch?: boolean
}

export function TimelineBar({
  card,
  barProps,
  rowIndex,
  columnId,
  matchesSearch = true,
}: TimelineBarProps) {
  const setOpenedCardId = useTimelineStore((s) => s.setOpenedCardId)
  const setHoveredCardId = useTimelineStore((s) => s.setHoveredCardId)
  const searchQuery = useTimelineStore((s) => s.searchQuery)
  const { left, width, hasSchedule } = barProps

  const top = rowIndex * ROW_HEIGHT + 8
  const barHeight = ROW_HEIGHT - 16

  // Checklist progress
  const totalItems = card.checklists.reduce(
    (sum, cl) => sum + (cl.totalCount ?? cl.items.length),
    0,
  )
  const completedItems = card.checklists.reduce(
    (sum, cl) => sum + (cl.completedCount ?? cl.items.filter((i) => i.completed).length),
    0,
  )
  const completedRatio = totalItems > 0 ? completedItems / totalItems : 0
  const hasChecklists = totalItems > 0

  // Urgency glow (task 8.4)
  const urgency = getCardUrgency(card)
  let urgencyStyle: React.CSSProperties = {}
  if (urgency === 'overdue') {
    urgencyStyle = {
      boxShadow: '0 0 0 2px rgba(239,68,68,0.9), 0 0 8px rgba(239,68,68,0.4)',
    }
  } else if (urgency === 'due-soon') {
    urgencyStyle = {
      boxShadow: '0 0 0 2px rgba(249,115,22,0.9), 0 0 8px rgba(249,115,22,0.4)',
    }
  }

  const isSearchDimmed = searchQuery.trim() !== '' && !matchesSearch

  // No-schedule bar (task 8.5)
  if (!hasSchedule) {
    return (
      <div
        onClick={() => setOpenedCardId(card.id)}
        onMouseEnter={() => setHoveredCardId(card.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        style={{ top, height: barHeight, width: 120, left: 4, zIndex: 1 }}
        className={`absolute cursor-pointer select-none overflow-hidden rounded border-2 border-dashed border-gray-400 bg-transparent transition-opacity hover:opacity-80 dark:border-gray-500${isSearchDimmed ? ' opacity-[0.15]' : ''}`}
        title={card.title}
      >
        <span className="block truncate px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          {card.title}
        </span>
      </div>
    )
  }

  const colorClasses = columnId !== null ? getColumnColor(columnId).bg : 'bg-blue-500'

  return (
    <div
      onClick={() => setOpenedCardId(card.id)}
      onMouseEnter={() => setHoveredCardId(card.id)}
      onMouseLeave={() => setHoveredCardId(null)}
      style={{ top, height: barHeight, left, width, ...urgencyStyle }}
      className={`absolute cursor-pointer select-none overflow-hidden rounded ${colorClasses} transition-opacity hover:opacity-90${isSearchDimmed ? ' opacity-[0.15]' : ''}`}
      title={card.title}
    >
      {/* Checklist progress overlay (task 8.3) */}
      {hasChecklists && (
        <div
          className="absolute inset-y-0 left-0 bg-white/30"
          style={{ width: `${completedRatio * 100}%` }}
        />
      )}

      {/* Bar content */}
      <div className="relative flex h-full items-center gap-1 px-2">
        <span className="flex-1 truncate text-xs font-medium text-white drop-shadow-sm">
          {card.title}
        </span>
        {hasChecklists && (
          <span className="shrink-0 text-xs text-white/80">
            {completedItems}/{totalItems}
          </span>
        )}
      </div>
    </div>
  )
}
