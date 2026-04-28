import type { TimelineZoom } from '@/stores/timelineStore'
import type { Board, Card, Dependency } from '@/types'
import { useCallback, useRef } from 'react'
import { TimelineCanvas } from './TimelineCanvas'
import { TimelineDateHeader } from './TimelineDateHeader'
import { TimelineLeftPanel } from './TimelineLeftPanel'
import type { BarProps, TimelineRow } from './useTimelineData'

interface TimelineGridProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  rows: TimelineRow[]
  rangeStart: Date
  rangeEnd: Date
  dayCount: number
  dayWidth: number
  zoom: TimelineZoom
  filteredDeps: Dependency[]
  rowIndexMap: Map<number, number>
  getBarProps: (card: Card) => BarProps
  board: Board
}

export function TimelineGrid({
  scrollContainerRef,
  rows,
  rangeStart,
  rangeEnd,
  dayCount,
  dayWidth,
  zoom,
  filteredDeps,
  rowIndexMap,
  getBarProps,
  board,
}: TimelineGridProps) {
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  // Task 5.1: vertical scroll sync via requestAnimationFrame
  const handleCanvasScroll = useCallback(() => {
    if (isSyncing.current) return
    const canvas = scrollContainerRef.current
    const left = leftPanelRef.current
    if (!canvas || !left) return
    isSyncing.current = true
    requestAnimationFrame(() => {
      if (left && canvas) {
        left.scrollTop = canvas.scrollTop
      }
      isSyncing.current = false
    })
  }, [scrollContainerRef])

  const HEADER_H = 56

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column: header spacer + scrollable panel */}
      <div className="flex w-[260px] shrink-0 flex-col border-r dark:border-gray-700">
        {/* Spacer matches date header height */}
        <div
          className="shrink-0 border-b bg-white dark:border-gray-700 dark:bg-gray-900"
          style={{ height: HEADER_H }}
        />
        {/* Scrollable left panel (task 5.1: overflow hidden, synced via JS) */}
        <div ref={leftPanelRef} className="flex-1 overflow-hidden">
          <TimelineLeftPanel rows={rows} />
        </div>
      </div>

      {/* Right column: date header + canvas (both share same scroll container) */}
      {/* Task 5.2: horizontal scroll shared via single container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={handleCanvasScroll}
      >
        {/* Sticky date header — stays at top during vertical scroll */}
        <div className="sticky top-0 z-10">
          <TimelineDateHeader
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            dayCount={dayCount}
            dayWidth={dayWidth}
            zoom={zoom}
          />
        </div>

        {/* Canvas content */}
        <TimelineCanvas
          rows={rows}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          dayCount={dayCount}
          dayWidth={dayWidth}
          filteredDeps={filteredDeps}
          rowIndexMap={rowIndexMap}
          getBarProps={getBarProps}
          board={board}
        />
      </div>
    </div>
  )
}
