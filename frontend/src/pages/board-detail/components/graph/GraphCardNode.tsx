import type { GraphCardNodeData } from '@/hooks/dependency/useGraphData'
import { formatCardDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { getPriorityConfig, getTagColorClasses, getUrgencyBorderClass } from '@/lib/styleConfig'
import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { Calendar, Flag, Flame } from 'lucide-react'

export function GraphCardNode({ data }: NodeProps<Node<GraphCardNodeData>>) {
  const { card, column, urgency, dimmed } = data
  const priority = getPriorityConfig(card.priority)
  const startDate = card.startTime ? formatCardDate(card.startTime) || null : null
  const endDate = card.endTime ? formatCardDate(card.endTime) || null : null
  const dateStr =
    startDate && endDate
      ? `${startDate} – ${endDate}`
      : (endDate ?? startDate ?? null)

  const hasMetaRow =
    card.tags.length > 0 ||
    dateStr != null ||
    (card.priority != null && card.priority > 0) ||
    card.storyPoint != null

  return (
    <div
      className={cn(
        'w-[220px] rounded-lg border-2 bg-white px-2 pb-1.5 pt-2 text-xs transition-opacity dark:bg-gray-800',
        getUrgencyBorderClass(urgency),
        dimmed && 'opacity-[0.18] saturate-50',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Tags row — long color bars above title */}
      {card.tags.length > 0 && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {card.tags.slice(0, 5).map((tag) => {
            const cls = getTagColorClasses(tag.color)
            return (
              <span
                key={tag.id}
                className={cn('inline-block h-[5px] w-6 rounded-full', cls.bg)}
                title={tag.name}
              />
            )
          })}
        </div>
      )}

      {/* Title */}
      <p className="mb-1 line-clamp-2 font-semibold leading-tight text-gray-900 dark:text-gray-100">
        {card.title}
      </p>

      {/* Meta row: date + priority + story points */}
      {hasMetaRow && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {dateStr && (
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 whitespace-nowrap',
                urgency === 'overdue' ? 'text-red-500'
                  : urgency === 'due-soon' ? 'text-orange-500'
                  : 'text-gray-400',
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              {dateStr}
            </span>
          )}
          {priority && card.priority != null && card.priority > 0 && (
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 whitespace-nowrap font-medium',
                priority.textClass,
              )}
            >
              <Flag className="h-2.5 w-2.5" />P{priority.value}
            </span>
          )}
          {card.storyPoint != null && (
            <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
              <Flame className="h-2.5 w-2.5" />
              {card.storyPoint}
            </span>
          )}
        </div>
      )}

      {/* Column name + card id */}
      <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-gray-100 pt-1 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {column.name}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          #{card.id}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </div>
  )
}
