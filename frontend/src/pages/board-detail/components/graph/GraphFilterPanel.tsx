import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoardDetail } from '@/hooks/board/queries/useBoardDetail'
import { useBoardTags } from '@/hooks/tag/queries/useBoardTags'
import { useGraphViewStore } from '@/stores/graphViewStore'
import { getColumnColor, getTagColorClasses } from '@/lib/styleConfig'
import type { DependencyType } from '@/types'

const RELATION_TYPES: DependencyType[] = ['blocks', 'parent_of', 'related_to', 'duplicates']

const EDGE_PREVIEW: Record<DependencyType, { stroke: string; dash?: string }> = {
  blocks: { stroke: '#ef4444' },
  parent_of: { stroke: '#3b82f6' },
  related_to: { stroke: '#22c55e', dash: '6 3' },
  duplicates: { stroke: '#9ca3af', dash: '3 3' },
}

interface GraphFilterPanelProps {
  boardId: number
}

export function GraphFilterPanel({ boardId }: GraphFilterPanelProps) {
  const { t } = useTranslation()
  const { data: board } = useBoardDetail(boardId)
  const { data: allTags = [] } = useBoardTags(boardId)
  const filters = useGraphViewStore((s) => s.filters)
  const setFilters = useGraphViewStore((s) => s.setFilters)
  const clearFilters = useGraphViewStore((s) => s.clearFilters)

  const panelRef = useRef<HTMLDivElement>(null)

  function toggleRelationType(type: DependencyType) {
    const current = filters.relationTypes
    setFilters({
      relationTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    })
  }

  function toggleColumn(id: number) {
    const current = filters.columnIds
    setFilters({
      columnIds: current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id],
    })
  }

  function toggleTag(id: number) {
    const current = filters.tagIds
    setFilters({
      tagIds: current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id],
    })
  }

  const columns = board?.columns ?? []

  return (
    <div
      ref={panelRef}
      className="absolute left-1/2 top-[60px] z-20 w-80 -translate-x-1/2 rounded-xl border bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Relation types */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('graphView.relationTypes')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RELATION_TYPES.map((type) => {
            const active = filters.relationTypes.includes(type)
            const preview = EDGE_PREVIEW[type]
            return (
              <button
                key={type}
                onClick={() => toggleRelationType(type)}
                className={[
                  'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors',
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300',
                ].join(' ')}
              >
                <svg width="20" height="8">
                  <line
                    x1="0" y1="4" x2="20" y2="4"
                    stroke={preview.stroke}
                    strokeWidth="2"
                    strokeDasharray={preview.dash}
                  />
                </svg>
                {t(`graphView.relationType.${type}`)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Columns */}
      {columns.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('graphView.columns')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col) => {
              const active = filters.columnIds.includes(col.id)
              const colColor = getColumnColor(col.id)
              return (
                <button
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className={[
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300',
                  ].join(' ')}
                >
                  <span className={`h-2 w-2 rounded-full ${colColor.bg}`} />
                  {col.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('graphView.dateRange')}
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters({ dateTo: e.target.value || null })}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('graphView.tags')}
          </p>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {allTags.map((tag) => {
              const active = filters.tagIds.includes(tag.id)
              const cls = getTagColorClasses(tag.color)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300',
                  ].join(' ')}
                >
                  <span className={`h-2 w-2 rounded-full ${cls.bg}`} />
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Clear */}
      <button
        onClick={clearFilters}
        className="w-full rounded-lg border border-gray-200 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        {t('graphView.clearFilters')}
      </button>
    </div>
  )
}
