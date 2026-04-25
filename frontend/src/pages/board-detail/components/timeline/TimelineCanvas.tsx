import { useTimelineStore } from '@/stores/timelineStore'
import type { Board, Card, Dependency } from '@/types'
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  isMonday,
  isWeekend,
  startOfDay,
} from 'date-fns'
import { TimelineArrows } from './TimelineArrows'
import { TimelineBar } from './TimelineBar'
import type { BarProps, TimelineRow } from './useTimelineData'
import { ROW_HEIGHT } from './useTimelineData'

interface TimelineCanvasProps {
  rows: TimelineRow[]
  rangeStart: Date
  rangeEnd: Date
  dayCount: number
  dayWidth: number
  filteredDeps: Dependency[]
  rowIndexMap: Map<number, number>
  getBarProps: (card: Card) => BarProps
  board: Board
}

export function TimelineCanvas({
  rows,
  rangeStart,
  rangeEnd,
  dayCount,
  dayWidth,
  filteredDeps,
  rowIndexMap,
  getBarProps,
  board,
}: TimelineCanvasProps) {
  const hoveredCardId = useTimelineStore((s) => s.hoveredCardId)

  const totalWidth = dayCount * dayWidth
  const totalHeight = rows.length * ROW_HEIGHT

  const today = startOfDay(new Date())
  const todayLeft = differenceInDays(today, rangeStart) * dayWidth

  // Build card lookup map
  const allCardsMap = new Map<number, Card>()
  for (const col of board.columns) {
    for (const card of col.cards ?? []) {
      allCardsMap.set(card.id, card)
    }
  }

  // Build column lookup for bar colors
  const columnMap = new Map(board.columns.map((c) => [c.id, c]))

  // Task 9.2: weekend & week-start days
  const days = eachDayOfInterval({ start: rangeStart, end: addDays(rangeEnd, -1) })

  return (
    <div
      className="relative"
      style={{ width: totalWidth, height: totalHeight }}
    >
      {/* Background grid: weekend shading + week-start lines */}
      {days.map((day, idx) => {
        const left = idx * dayWidth
        const isWe = isWeekend(day)
        const isMon = isMonday(day)
        return (
          <div
            key={idx}
            className={`absolute top-0 h-full ${
              isWe ? 'bg-gray-100 dark:bg-gray-800/40' : ''
            }`}
            style={{ left, width: dayWidth }}
          >
            {isMon && (
              <div className="absolute inset-y-0 left-0 w-px bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        )
      })}

      {/* Horizontal row separators */}
      {rows.map((_, idx) => (
        <div
          key={idx}
          className="absolute left-0 right-0 h-px bg-gray-100 dark:bg-gray-800/60"
          style={{ top: (idx + 1) * ROW_HEIGHT - 1 }}
        />
      ))}

      {/* Today red line */}
      {todayLeft >= 0 && todayLeft <= totalWidth && (
        <div
          className="tl-today-line absolute top-0 z-10 w-px bg-red-500"
          style={{ left: todayLeft, height: totalHeight }}
        />
      )}

      {/* Row hover backgrounds */}
      {rows.map((row, idx) => {
        if (row.kind !== 'card') return null
        return (
          <div
            key={`row-bg-${row.card.id}`}
            style={{
              position: 'absolute',
              top: idx * ROW_HEIGHT,
              left: 0,
              width: totalWidth,
              height: ROW_HEIGHT,
              pointerEvents: 'none',
              zIndex: 0,
            }}
            className={
              row.card.id === hoveredCardId
                ? 'bg-gray-100/70 dark:bg-gray-700/30'
                : ''
            }
          />
        )
      })}

      {/* Bars */}
      {rows.map((row, idx) => {
        if (row.kind !== 'card') return null
        const { card } = row
        const barProps = getBarProps(card)
        const col = columnMap.get(card.columnId)
        return (
          <TimelineBar
            key={card.id}
            card={card}
            barProps={barProps}
            rowIndex={idx}
            columnId={col?.id ?? null}
            matchesSearch={row.matchesSearch}
          />
        )
      })}

      {/* Dependency arrows */}
      <TimelineArrows
        filteredDeps={filteredDeps}
        rowIndexMap={rowIndexMap}
        getBarProps={getBarProps}
        allCards={allCardsMap}
        totalWidth={totalWidth}
        totalHeight={totalHeight}
      />
    </div>
  )
}
