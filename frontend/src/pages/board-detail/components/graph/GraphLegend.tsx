import { DEPENDENCY_EDGE_STYLES, URGENCY_HEX_COLORS } from '@/lib/styleConfig'
import { cn } from '@/lib/utils'
import { useGraphViewStore } from '@/stores/graphViewStore'
import type { DependencyType } from '@/types'
import { useTranslation } from 'react-i18next'

type RelationLabelKey =
  | 'graphView.relationType.blocks'
  | 'graphView.relationType.parent_of'
  | 'graphView.relationType.related_to'
  | 'graphView.relationType.duplicates'

type UrgencyLabelKey =
  | 'graphView.overdue'
  | 'graphView.dueSoon'
  | 'graphView.inProgress'

const EDGE_LEGEND_ITEMS: {
  type: DependencyType
  labelKey: RelationLabelKey
}[] = [
  { type: 'blocks', labelKey: 'graphView.relationType.blocks' },
  { type: 'parent_of', labelKey: 'graphView.relationType.parent_of' },
  { type: 'related_to', labelKey: 'graphView.relationType.related_to' },
  { type: 'duplicates', labelKey: 'graphView.relationType.duplicates' },
]

const URGENCY_LEGEND_ITEMS: {
  labelKey: UrgencyLabelKey
  colorKey: keyof typeof URGENCY_HEX_COLORS
}[] = [
  { labelKey: 'graphView.overdue', colorKey: 'overdue' },
  { labelKey: 'graphView.dueSoon', colorKey: 'due-soon' },
  { labelKey: 'graphView.inProgress', colorKey: 'due-in-progress' },
]

export function GraphLegend() {
  const { t } = useTranslation()

  const sidebarOpen = useGraphViewStore((s) => s.sidebarOpen)

  return (
    <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
      <div
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90',
          sidebarOpen ? 'lg:flex-row' : 'md:flex-row', // if sidebar is open, show legend on lg+ screens, otherwise show on md+ screens
        )}
      >
        {/* Edge style legend */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          {EDGE_LEGEND_ITEMS.map(({ type, labelKey }) => {
            const { stroke, strokeDasharray, markerEnd } =
              DEPENDENCY_EDGE_STYLES[type]
            return (
              <div key={type} className="flex items-center gap-1.5">
                <svg width="28" height="10">
                  <line
                    x1="0"
                    y1="5"
                    x2="28"
                    y2="5"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeDasharray={strokeDasharray}
                  />
                  {markerEnd && (
                    <polygon points="22,2 28,5 22,8" fill={stroke} />
                  )}
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {t(labelKey)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Vertical divider — only on md+ */}
        <div
          className={cn(
            'hidden h-5 w-px bg-gray-200 dark:bg-gray-600',
            sidebarOpen ? 'lg:block' : 'md:block', // if sidebar is open, show divider on lg+ screens, otherwise show on md+ screens
          )}
        />

        {/* Card border urgency legend */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          {URGENCY_LEGEND_ITEMS.map(({ labelKey, colorKey }) => (
            <div key={labelKey} className="flex items-center gap-1.5">
              <span
                className="inline-block h-4 w-4 rounded-sm border-2 bg-transparent"
                style={{ borderColor: URGENCY_HEX_COLORS[colorKey] }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {t(labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
