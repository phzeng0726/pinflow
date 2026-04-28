import { useState, useEffect } from 'react'
import { LayoutGrid, GitBranch, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGraphViewStore } from '@/stores/graphViewStore'

interface GraphToolbarProps {
  filterOpen: boolean
  onToggleFilter: () => void
}

export function GraphToolbar({ filterOpen, onToggleFilter }: GraphToolbarProps) {
  const { t } = useTranslation()
  const layoutMode = useGraphViewStore((s) => s.layoutMode)
  const setLayoutMode = useGraphViewStore((s) => s.setLayoutMode)
  const setSearchQuery = useGraphViewStore((s) => s.setSearchQuery)
  const filters = useGraphViewStore((s) => s.filters)

  const [inputValue, setInputValue] = useState('')

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(inputValue), 300)
    return () => clearTimeout(t)
  }, [inputValue, setSearchQuery])

  const hasActiveFilters =
    filters.relationTypes.length > 0 ||
    filters.columnIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.dateFrom != null ||
    filters.dateTo != null

  return (
    <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
        {/* Search */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('graphView.searchPlaceholder')}
          className="w-48 rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />

        {/* Layout toggle */}
        <button
          onClick={() => setLayoutMode('hierarchy')}
          title={t('graphView.hierarchy')}
          className={[
            'rounded p-1.5 transition-colors',
            layoutMode === 'hierarchy'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
          ].join(' ')}
        >
          <GitBranch className="h-4 w-4" />
        </button>
        <button
          onClick={() => setLayoutMode('cluster')}
          title={t('graphView.cluster')}
          className={[
            'rounded p-1.5 transition-colors',
            layoutMode === 'cluster'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
          ].join(' ')}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />

        {/* Filter trigger */}
        <button
          onClick={onToggleFilter}
          title={t('graphView.filter')}
          data-filter-trigger="true"
          className={[
            'relative rounded p-1.5 transition-colors',
            filterOpen || hasActiveFilters
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
          ].join(' ')}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>
    </div>
  )
}
