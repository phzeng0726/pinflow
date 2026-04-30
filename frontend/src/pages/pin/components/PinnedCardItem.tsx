import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useBoardDetail } from '@/hooks/board/queries/useBoardDetail'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { formatCardDate, getScheduleUrgencyClass } from '@/lib/dates'
import {
  getPriorityConfig,
  getTagColorClasses,
} from '@/lib/styleConfig'
import { cn } from '@/lib/utils'
import type { PinnedCard } from '@/types'
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  Flag,
  Flame,
  GripVertical,
  Link2,
  PinOff,
  SquarePen,
} from 'lucide-react'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { PinChecklistPanel } from './PinChecklistPanel'

interface PinnedCardItemProps {
  card: PinnedCard
  onUnpin: (id: number) => void
  onEdit: (card: PinnedCard) => void
}

export function PinnedCardItem(props: PinnedCardItemProps) {
  const { card, onUnpin, onEdit } = props
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false)
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { data: boardDetail } = useBoardDetail(card.boardId)
  const { moveCard } = useCardMutations(card.boardId)
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } =
    useSortable({ id: card.id })

  const tags = card.tags ?? []
  const hasSchedule = !!card.startTime || !!card.endTime
  const scheduleUrgencyClass = getScheduleUrgencyClass(
    card.endTime,
    card.startTime,
  )
  const { totalCount, completedCount } = card.checklistSummary ?? {
    totalCount: 0,
    completedCount: 0,
  }
  const hasMetadata =
    card.storyPoint != null ||
    hasSchedule ||
    totalCount > 0 ||
    (card.priority != null && card.priority > 0) ||
    card.dependencyCount > 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative rounded-lg border-l-4 border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <GripVertical
          className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
          {...attributes}
          {...listeners}
        />
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
                      tag.color &&
                        `${colorCls.bg} border-transparent text-white`,
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
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className={cn(
                    'flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs',
                    completedCount === totalCount
                      ? 'text-green-500'
                      : 'text-gray-400',
                  )}
                >
                  <CheckSquare className="h-3 w-3" />
                  {completedCount}/{totalCount}
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
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
          <div className="mt-2 flex items-center gap-0.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {card.boardName}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">/</span>
            <Popover open={columnPopoverOpen} onOpenChange={setColumnPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                >
                  {card.columnName}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <p className="mb-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  {t('pin.moveToColumn')}
                </p>
                {(boardDetail?.columns ?? []).map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setColumnPopoverOpen(false)
                      if (col.id !== card.columnId) {
                        moveCard.mutate({ id: card.id, columnId: col.id, position: 0.5 })
                      }
                    }}
                  >
                    {col.id === card.columnId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    )}
                    {col.id !== card.columnId && (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {col.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          {expanded && totalCount > 0 && (
            <PinChecklistPanel cardId={card.id} boardId={card.boardId} />
          )}
        </div>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Actions"
              className="mt-0.5 h-6 w-6 shrink-0 text-gray-400 opacity-0 transition-all hover:text-gray-700 group-hover:opacity-100 dark:hover:text-gray-200"
            >
              <Ellipsis className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="end">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                setPopoverOpen(false)
                onEdit(card)
              }}
            >
              <SquarePen className="h-3.5 w-3.5" />
              {t('common.edit')}
            </button>
            <button
              type="button"
              data-testid="unpin-btn"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                setPopoverOpen(false)
                onUnpin(card.id)
              }}
            >
              <PinOff className="h-3.5 w-3.5" />
              {t('pin.unpin')}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
