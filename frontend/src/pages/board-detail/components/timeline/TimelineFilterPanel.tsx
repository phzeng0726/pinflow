import { getDependencyEdgeStyle } from '@/lib/styleConfig'
import { useTimelineStore } from '@/stores/timelineStore'
import type { DependencyType } from '@/types'
import { useTranslation } from 'react-i18next'

const ALL_DEP_TYPES: DependencyType[] = [
  'blocks',
  'parent_of',
  'duplicates',
  'related_to',
]

export function TimelineFilterPanel() {
  const { t } = useTranslation()
  const depTypeFilter = useTimelineStore((s) => s.depTypeFilter)
  const setDepTypeFilter = useTimelineStore((s) => s.setDepTypeFilter)

  const toggle = (type: DependencyType) => {
    if (depTypeFilter.includes(type)) {
      setDepTypeFilter(depTypeFilter.filter((t) => t !== type))
    } else {
      setDepTypeFilter([...depTypeFilter, type])
    }
  }

  return (
    <div
      data-filter-panel
      className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Show All / Hide All */}
      <div className="mb-2 flex gap-1">
        <button
          onClick={() => setDepTypeFilter(ALL_DEP_TYPES)}
          className="flex-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {t('timeline.showAll')}
        </button>
        <button
          onClick={() => setDepTypeFilter([])}
          className="flex-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {t('timeline.hideAll')}
        </button>
      </div>

      <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        {t('graphView.relationTypes')}
      </p>
      <div className="space-y-1.5">
        {ALL_DEP_TYPES.map((type) => {
          const isActive = depTypeFilter.includes(type)
          const style = getDependencyEdgeStyle(type)
          return (
            <div
              key={type}
              onClick={() => toggle(type)}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-700"
              style={{ opacity: isActive ? 1 : 0.4 }}
            >
              <svg width="28" height="10" className="shrink-0">
                <line
                  x1="2"
                  y1="5"
                  x2="26"
                  y2="5"
                  stroke={style.stroke}
                  strokeWidth="2"
                  strokeDasharray={style.strokeDasharray}
                />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t(`graphView.relationType.${type}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
