import type {
  TimelineDepMode,
  TimelineGroupBy,
  TimelineZoom,
} from '@/stores/timelineStore'
import { useTimelineStore } from '@/stores/timelineStore'
import { differenceInDays, startOfDay } from 'date-fns'
import { AlignJustify, Columns2, Filter, Milestone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimelineFilterPanel } from './TimelineFilterPanel'

interface TimelineToolbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>
  rangeStart: Date
  dayWidth: number
}

const ZOOM_OPTIONS: { value: TimelineZoom; label: string }[] = [
  { value: 'day', label: 'D' },
  { value: 'week', label: 'W' },
  { value: 'month', label: 'M' },
]

const GROUP_OPTIONS: {
  value: TimelineGroupBy
  label: 'flat' | 'byColumn'
  icon: React.ReactNode
}[] = [
  {
    value: 'flat',
    label: 'flat',
    icon: <AlignJustify className="h-3.5 w-3.5" />,
  },
  {
    value: 'by-column',
    label: 'byColumn',
    icon: <Columns2 className="h-3.5 w-3.5" />,
  },
]

const DEP_MODE_OPTIONS: { value: TimelineDepMode; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'hover', label: 'hover' },
  { value: 'off', label: 'off' },
]

export function TimelineToolbar({
  scrollContainerRef,
  rangeStart,
  dayWidth,
}: TimelineToolbarProps) {
  const { t } = useTranslation()

  const zoom = useTimelineStore((s) => s.zoom)
  const groupBy = useTimelineStore((s) => s.groupBy)
  const depMode = useTimelineStore((s) => s.depMode)
  const filterPanelOpen = useTimelineStore((s) => s.filterPanelOpen)
  const depTypeFilter = useTimelineStore((s) => s.depTypeFilter)
  const setZoom = useTimelineStore((s) => s.setZoom)
  const setGroupBy = useTimelineStore((s) => s.setGroupBy)
  const setDepMode = useTimelineStore((s) => s.setDepMode)
  const setSearchQuery = useTimelineStore((s) => s.setSearchQuery)
  const setFilterPanelOpen = useTimelineStore((s) => s.setFilterPanelOpen)

  const [inputValue, setInputValue] = useState('')
  const filterBtnRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(inputValue), 200)
    return () => clearTimeout(timer)
  }, [inputValue, setSearchQuery])

  // Task 11.1: Today button scroll
  const handleTodayClick = () => {
    const container = scrollContainerRef.current
    if (!container) return
    const today = startOfDay(new Date())
    const todayLeft = differenceInDays(today, rangeStart) * dayWidth
    const viewportWidth = container.clientWidth
    container.scrollTo({
      left: todayLeft - viewportWidth * 0.25,
      behavior: 'smooth',
    })
  }

  const hasFilterActive = depTypeFilter.length < 4

  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
      {/* Zoom */}
      <div className="flex items-center rounded-md border bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-700">
        {ZOOM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setZoom(opt.value)}
            className={[
              'rounded px-2.5 py-0.5 text-xs font-medium transition-colors',
              zoom === opt.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {t(`timeline.zoom.${opt.value}`)}
          </button>
        ))}
      </div>

      {/* GroupBy */}
      <div className="flex items-center rounded-md border bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-700">
        {GROUP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGroupBy(opt.value)}
            title={t(`timeline.groupBy.${opt.label}`)}
            className={[
              'flex items-center rounded px-2 py-0.5 transition-colors',
              groupBy === opt.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {opt.icon}
          </button>
        ))}
      </div>

      {/* DepMode */}
      <div className="flex items-center rounded-md border bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-700">
        {DEP_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDepMode(opt.value)}
            className={[
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              depMode === opt.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {t(`timeline.depMode.${opt.value}`)}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={t('timeline.searchPlaceholder')}
        className="w-40 rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
      />

      {/* Filter button */}
      <div className="relative" ref={filterBtnRef} data-filter-trigger>
        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          title={t('timeline.filter')}
          className={[
            'relative rounded p-1.5 transition-colors',
            filterPanelOpen || hasFilterActive
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
          ].join(' ')}
        >
          <Filter className="h-4 w-4" />
          {hasFilterActive && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
        </button>
        {filterPanelOpen && <TimelineFilterPanel />}
      </div>

      {/* Today button */}
      <button
        onClick={handleTodayClick}
        className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Milestone className="h-3.5 w-3.5" />
        {t('timeline.today')}
      </button>
    </div>
  )
}
