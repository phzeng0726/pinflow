import { getPriorityConfig } from '@/lib/styleConfig'
import { useTimelineStore } from '@/stores/timelineStore'
import { useTranslation } from 'react-i18next'
import type { TimelineRow } from './useTimelineData'
import { ROW_HEIGHT } from './useTimelineData'

interface TimelineLeftPanelProps {
  rows: TimelineRow[]
}

export function TimelineLeftPanel({ rows }: TimelineLeftPanelProps) {
  const { t } = useTranslation()
  const setHoveredCardId = useTimelineStore((s) => s.setHoveredCardId)
  const hoveredCardId = useTimelineStore((s) => s.hoveredCardId)
  const depMode = useTimelineStore((s) => s.depMode)
  const searchQuery = useTimelineStore((s) => s.searchQuery)

  return (
    <div style={{ height: rows.length * ROW_HEIGHT }}>
      {rows.map((row, idx) => {
        if (row.kind === 'lane') {
          return (
            <div
              key={`lane-${row.columnId ?? 'no-dates'}-${idx}`}
              style={{ height: ROW_HEIGHT }}
              className="flex items-center gap-2 border-b border-t bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800/60"
            >
              <span className="flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                {row.columnName === 'No dates' ? t('timeline.noDates') : row.columnName}
              </span>
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {row.count}
              </span>
            </div>
          )
        }

        const { card } = row
        const priorityCfg = getPriorityConfig(card.priority)
        const totalItems = card.checklists.reduce(
          (sum, cl) => sum + (cl.totalCount ?? cl.items.length),
          0,
        )
        const completedItems = card.checklists.reduce(
          (sum, cl) =>
            sum + (cl.completedCount ?? cl.items.filter((i) => i.completed).length),
          0,
        )

        const isHovered = hoveredCardId === card.id
        const isDimmedByDep =
          depMode === 'hover' &&
          hoveredCardId !== null &&
          !isHovered
        const isDimmedBySearch =
          searchQuery.trim() !== '' && !row.matchesSearch
        const isDimmed = isDimmedByDep || isDimmedBySearch

        return (
          <div
            key={`card-${card.id}`}
            style={{ height: ROW_HEIGHT }}
            className={`flex cursor-default items-center gap-2 border-b px-3 transition-opacity dark:border-gray-700/50 ${
              isDimmed ? 'opacity-[0.15]' : ''
            } ${isHovered ? 'bg-gray-100 dark:bg-gray-700/50' : ''}`}
            onMouseEnter={() => setHoveredCardId(card.id)}
            onMouseLeave={() => setHoveredCardId(null)}
          >
            {priorityCfg && (
              <span className={`shrink-0 text-xs font-bold ${priorityCfg.textClass}`}>
                P{card.priority}
              </span>
            )}
            <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-200">
              {card.title}
            </span>
            {totalItems > 0 && (
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {completedItems}/{totalItems}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
