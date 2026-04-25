import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCardDate, getCardUrgency, getScheduleUrgencyClass } from '@/lib/dates'
import { getColumnColor, getPriorityConfig, getTagColorClasses } from '@/lib/styleConfig'
import { cn } from '@/lib/utils'
import { useTimelineStore } from '@/stores/timelineStore'
import type { Card } from '@/types'
import { Calendar, CheckSquare, Flag, Flame, Link2 } from 'lucide-react'
import type { BarProps } from './useTimelineData'
import { ROW_HEIGHT } from './useTimelineData'

interface TimelineBarProps {
  card: Card
  barProps: BarProps
  rowIndex: number
  columnId: number | null
  matchesSearch?: boolean
}

function BarTooltipContent({ card }: { card: Card }) {
  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const totalItems = checklists.reduce(
    (sum, cl) => sum + (cl.totalCount ?? cl.items?.length ?? 0),
    0,
  )
  const completedItems = checklists.reduce(
    (sum, cl) =>
      sum + (cl.completedCount ?? cl.items?.filter((i) => i.completed).length ?? 0),
    0,
  )
  const priorityCfg = getPriorityConfig(card.priority)
  const scheduleClass = getScheduleUrgencyClass(card.endTime, card.startTime)

  const scheduleText = (() => {
    if (card.startTime && card.endTime) {
      return `${formatCardDate(card.startTime)} – ${formatCardDate(card.endTime)}`
    }
    if (card.startTime) return formatCardDate(card.startTime)
    if (card.endTime) return formatCardDate(card.endTime)
    return null
  })()

  const hasAnyMeta =
    scheduleText ||
    (card.priority != null && card.priority > 0) ||
    card.storyPoint != null ||
    totalItems > 0 ||
    card.dependencyCount > 0

  return (
    <div className="max-w-[220px] space-y-1.5 p-0.5">
      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
        {card.title}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const colorCls = getTagColorClasses(tag.color)
            return (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs',
                  tag.color && `${colorCls.bg} border-transparent text-white`,
                )}
              >
                {tag.name}
              </Badge>
            )
          })}
        </div>
      )}

      {hasAnyMeta && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {scheduleText && (
            <span className={cn('flex items-center gap-0.5 text-xs', scheduleClass)}>
              <Calendar className="h-3 w-3" />
              {scheduleText}
            </span>
          )}
          {priorityCfg && card.priority != null && card.priority > 0 && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                priorityCfg.textClass,
              )}
            >
              <Flag className="h-3 w-3" />
              P{priorityCfg.value}
            </span>
          )}
          {card.storyPoint != null && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Flame className="h-3 w-3" />
              {card.storyPoint}
            </span>
          )}
          {totalItems > 0 && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                completedItems === totalItems ? 'text-green-500' : 'text-gray-400',
              )}
            >
              <CheckSquare className="h-3 w-3" />
              {completedItems}/{totalItems}
            </span>
          )}
          {card.dependencyCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Link2 className="h-3 w-3" />
              {card.dependencyCount}
            </span>
          )}
          <span className="text-xs text-gray-400">#{card.id}</span>
        </div>
      )}

      {!hasAnyMeta && (
        <span className="text-xs text-gray-400">#{card.id}</span>
      )}
    </div>
  )
}

export function TimelineBar({
  card,
  barProps,
  rowIndex,
  columnId,
  matchesSearch = true,
}: TimelineBarProps) {
  const setOpenedCardId = useTimelineStore((s) => s.setOpenedCardId)
  const searchQuery = useTimelineStore((s) => s.searchQuery)
  const { left, width, hasSchedule } = barProps

  const top = rowIndex * ROW_HEIGHT + 8
  const barHeight = ROW_HEIGHT - 16

  const totalItems = (card.checklists ?? []).reduce(
    (sum, cl) => sum + (cl.totalCount ?? cl.items?.length ?? 0),
    0,
  )
  const completedItems = (card.checklists ?? []).reduce(
    (sum, cl) =>
      sum + (cl.completedCount ?? cl.items?.filter((i) => i.completed).length ?? 0),
    0,
  )
  const completedRatio = totalItems > 0 ? completedItems / totalItems : 0
  const hasChecklists = totalItems > 0

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

  if (!hasSchedule) {
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            onClick={() => setOpenedCardId(card.id)}
            style={{ top, height: barHeight, width: 120, left: 4, zIndex: 1 }}
            className={cn(
              'absolute cursor-pointer select-none overflow-hidden rounded border-2 border-dashed border-gray-400 bg-transparent transition-opacity hover:opacity-80 dark:border-gray-500',
              isSearchDimmed && 'opacity-[0.15]',
            )}
          >
            <span className="block truncate px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              {card.title}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <BarTooltipContent card={card} />
        </TooltipContent>
      </Tooltip>
    )
  }

  const colorClasses = columnId !== null ? getColumnColor(columnId).bg : 'bg-blue-500'

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div
          onClick={() => setOpenedCardId(card.id)}
          style={{ top, height: barHeight, left, width, ...urgencyStyle }}
          className={cn(
            'absolute cursor-pointer select-none overflow-hidden rounded transition-opacity hover:opacity-90',
            colorClasses,
            isSearchDimmed && 'opacity-[0.15]',
          )}
        >
          {hasChecklists && (
            <div
              className="absolute inset-y-0 left-0 bg-white/30"
              style={{ width: `${completedRatio * 100}%` }}
            />
          )}
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
      </TooltipTrigger>
      <TooltipContent side="top">
        <BarTooltipContent card={card} />
      </TooltipContent>
    </Tooltip>
  )
}
