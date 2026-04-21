import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCardDate, getScheduleUrgencyClass } from '@/lib/dates'
import { getColumnColor, getPriorityConfig, getTagColorClasses } from '@/lib/styleConfig'
import { cn } from '@/lib/utils'
import type { PinnedCard } from '@/types'
import {
  Calendar,
  CheckSquare,
  Flag,
  Flame,
  Link2,
  PinOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PinnedCardItemProps {
  card: PinnedCard
  onUnpin: (id: number) => void
}

export function PinnedCardItem(props: PinnedCardItemProps) {
  const { card, onUnpin } = props
  const { t } = useTranslation()

  const tags = card.tags ?? []
  const hasSchedule = !!card.startTime || !!card.endTime
  const scheduleUrgencyClass = getScheduleUrgencyClass(card.endTime, card.startTime)
  const { totalCount, completedCount } = card.checklistSummary ?? {
    totalCount: 0,
    completedCount: 0,
  }
  const colorClass = getColumnColor(card.columnId).border

  const hasMetadata =
    card.storyPoint != null ||
    hasSchedule ||
    totalCount > 0 ||
    (card.priority != null && card.priority > 0) ||
    card.dependencyCount > 0

  return (
    <div
      className={cn(
        'group relative rounded-lg border-l-4 bg-white px-3 py-2 dark:bg-gray-800',
        colorClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {tags.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => {
                const colorCls = getTagColorClasses(tag.color)
                return (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className={cn(
                      'rounded px-1 py-0 text-[10px]',
                      tag.color && `${colorCls.bg} border-transparent text-white`,
                    )}
                  >
                    {tag.name}
                  </Badge>
                )
              })}
              {tags.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
          <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {card.title}
          </p>
          {card.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          )}
          {hasMetadata && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {hasSchedule && (
                <span
                  className={cn(
                    'flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs',
                    scheduleUrgencyClass,
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {card.startTime
                    ? formatCardDate(card.startTime)
                    : formatCardDate(card.endTime!)}
                  {card.startTime &&
                    card.endTime &&
                    ` – ${formatCardDate(card.endTime)}`}
                </span>
              )}
              {totalCount > 0 && (
                <span
                  className={cn(
                    'flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs',
                    completedCount === totalCount
                      ? 'text-green-500'
                      : 'text-gray-400',
                  )}
                >
                  <CheckSquare className="h-3 w-3" />
                  {completedCount}/{totalCount}
                </span>
              )}
              {card.priority != null &&
                card.priority > 0 &&
                (() => {
                  const p = getPriorityConfig(card.priority)
                  return (
                    <span
                      className={cn(
                        'flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs font-medium',
                        p?.textClass,
                      )}
                    >
                      <Flag className="h-3 w-3" />P{p?.value}
                    </span>
                  )
                })()}
              {card.storyPoint != null && (
                <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Flame className="h-3 w-3" />
                  {card.storyPoint}
                </span>
              )}
              {card.dependencyCount > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs text-gray-400">
                  <Link2 className="h-3 w-3" />
                  {card.dependencyCount}
                </span>
              )}
              <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs text-gray-400">
                #{card.id}
              </span>
            </div>
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
              aria-label={t('pin.unpin')}
              className="mt-0.5 h-6 w-6 shrink-0 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
              onClick={() => onUnpin(card.id)}
            >
              <PinOff className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('pin.unpin')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
