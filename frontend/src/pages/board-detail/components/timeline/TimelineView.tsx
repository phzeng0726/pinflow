import { useBoardDetail } from '@/hooks/board/queries/useBoardDetail'
import { useBoardDependencies } from '@/hooks/dependency/queries/useBoardDependencies'
import { useTimelineStore } from '@/stores/timelineStore'
import { useEffect, useRef } from 'react'
import { CardDetailDialog } from '../cards/CardDetailDialog'
import { TimelineGrid } from './TimelineGrid'
import { TimelineToolbar } from './TimelineToolbar'
import { useTimelineData } from './useTimelineData'

interface TimelineViewProps {
  boardId: number
}

export function TimelineView({ boardId }: TimelineViewProps) {
  const { data: board } = useBoardDetail(boardId)
  const { data: dependencies } = useBoardDependencies(boardId)

  const openedCardId = useTimelineStore((s) => s.openedCardId)
  const setOpenedCardId = useTimelineStore((s) => s.setOpenedCardId)
  const zoom = useTimelineStore((s) => s.zoom)
  const setFilterPanelOpen = useTimelineStore((s) => s.setFilterPanelOpen)
  const reset = useTimelineStore((s) => s.reset)

  // Task 12.2: reset store on unmount
  useEffect(() => () => reset(), [reset])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { rangeStart, rangeEnd, dayCount, dayWidth, rows, filteredDeps, rowIndexMap, getBarProps } =
    useTimelineData(board, dependencies)

  // Close filter panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        !target.closest('[data-filter-panel]') &&
        !target.closest('[data-filter-trigger]')
      ) {
        setFilterPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setFilterPanelOpen])

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      <TimelineToolbar
        scrollContainerRef={scrollContainerRef}
        rangeStart={rangeStart}
        dayWidth={dayWidth}
      />

      {board ? (
        <TimelineGrid
          scrollContainerRef={scrollContainerRef}
          rows={rows}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          dayCount={dayCount}
          dayWidth={dayWidth}
          zoom={zoom}
          filteredDeps={filteredDeps}
          rowIndexMap={rowIndexMap}
          getBarProps={getBarProps}
          board={board}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          Loading...
        </div>
      )}

      {/* Task 4.1: CardDetailDialog managed here */}
      {openedCardId !== null && (
        <CardDetailDialog
          boardId={boardId}
          cardId={openedCardId}
          onClose={() => setOpenedCardId(null)}
        />
      )}
    </div>
  )
}
