import { useTimelineStore } from '@/stores/timelineStore'
import type { Board, Card, Dependency } from '@/types'
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  parseISO,
  startOfDay,
  subMonths,
  subWeeks,
} from 'date-fns'
import { useMemo } from 'react'

export const ROW_HEIGHT = 48

const DAY_WIDTHS: Record<'day' | 'week' | 'month', number> = {
  day: 28,
  week: 72 / 7,
  month: 3,
}

export interface LaneRow {
  kind: 'lane'
  columnId: number | null
  columnName: string
  count: number
}

export interface CardRow {
  kind: 'card'
  card: Card
  matchesSearch: boolean
}

export type TimelineRow = LaneRow | CardRow

export interface BarProps {
  left: number
  width: number
  hasSchedule: boolean
  isEndDateOnly: boolean
}

export function useTimelineData(
  board: Board | undefined,
  dependencies: Dependency[] | undefined,
) {
  const zoom = useTimelineStore((s) => s.zoom)
  const groupBy = useTimelineStore((s) => s.groupBy)
  const searchQuery = useTimelineStore((s) => s.searchQuery)
  const depTypeFilter = useTimelineStore((s) => s.depTypeFilter)

  return useMemo(() => {
    const dayWidth = DAY_WIDTHS[zoom]

    if (!board) {
      const today = startOfDay(new Date())
      const rangeStart = subMonths(today, 1)
      const rangeEnd = addMonths(today, 2)
      const dayCount = differenceInDays(rangeEnd, rangeStart)
      return {
        rangeStart,
        rangeEnd,
        dayCount,
        dayWidth,
        rows: [] as TimelineRow[],
        filteredDeps: [] as Dependency[],
        rowIndexMap: new Map<number, number>(),
        getBarProps: (_card: Card): BarProps => ({
          left: 0,
          width: 120,
          hasSchedule: false,
          isEndDateOnly: false,
        }),
      }
    }

    // Date range calculation
    const allCards: Card[] = board.columns.flatMap((c) => c.cards ?? [])
    const scheduledCards = allCards.filter((c) => c.startTime && c.endTime)
    const endOnlyCards = allCards.filter((c) => !c.startTime && c.endTime)

    let rangeStart: Date
    let rangeEnd: Date

    if (scheduledCards.length === 0 && endOnlyCards.length === 0) {
      const today = startOfDay(new Date())
      rangeStart = subMonths(today, 1)
      rangeEnd = addMonths(today, 2)
    } else {
      const today = startOfDay(new Date())
      const startDates = scheduledCards.map((c) => parseISO(c.startTime!))
      const endDates = [
        ...scheduledCards.map((c) => parseISO(c.endTime!)),
        ...endOnlyCards.map((c) => parseISO(c.endTime!)),
      ]
      const minStart =
        startDates.length > 0
          ? new Date(Math.min(...startDates.map((d) => d.getTime())))
          : today
      const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())))
      rangeStart = subWeeks(startOfDay(minStart), 4)
      rangeEnd = addWeeks(startOfDay(maxEnd), 4)
      const threeMonthsEnd = addMonths(rangeStart, 3)
      if (rangeEnd < threeMonthsEnd) rangeEnd = threeMonthsEnd
    }

    // Task 3.3: dayCount
    const dayCount = differenceInDays(rangeEnd, rangeStart)

    const getBarProps = (card: Card): BarProps => {
      const today = startOfDay(new Date())

      // Case 1: no dates
      if (!card.startTime && !card.endTime) {
        return { left: 0, width: 120, hasSchedule: false, isEndDateOnly: false }
      }

      // Case 2: start + end
      if (card.startTime && card.endTime) {
        const start = parseISO(card.startTime)
        const end = parseISO(card.endTime)
        const left = differenceInDays(start, rangeStart) * dayWidth
        const rawWidth = differenceInDays(end, start) * dayWidth
        const width = Math.max(rawWidth, dayWidth)
        return { left, width, hasSchedule: true, isEndDateOnly: false }
      }

      // Case 3: end only — infer start as today or end-1 if overdue
      if (!card.startTime && card.endTime) {
        const end = parseISO(card.endTime)
        const inferredStart = end < today ? addDays(end, -1) : today
        const left = differenceInDays(inferredStart, rangeStart) * dayWidth
        const rawWidth = differenceInDays(end, inferredStart) * dayWidth
        const width = Math.max(rawWidth, dayWidth)
        return { left, width, hasSchedule: true, isEndDateOnly: true }
      }

      // Case 4: start only — not handled this iteration, keep in No dates
      return { left: 0, width: 120, hasSchedule: false, isEndDateOnly: false }
    }

    // Task 3.5: rows generation
    const sortedColumns = [...board.columns].sort(
      (a, b) => a.position - b.position,
    )
    const query = searchQuery.toLowerCase()
    const matchesSearch = (card: Card) =>
      !query || card.title.toLowerCase().includes(query)
    const isScheduled = (card: Card) => !!card.endTime

    const rows: TimelineRow[] = []
    const rowIndexMap = new Map<number, number>()

    if (groupBy === 'by-column') {
      for (const col of sortedColumns) {
        const colCards = [...(col.cards ?? [])].sort(
          (a, b) => a.position - b.position,
        )
        const scheduled = colCards.filter(isScheduled)
        if (scheduled.length === 0) continue

        rows.push({
          kind: 'lane',
          columnId: col.id,
          columnName: col.name,
          count: scheduled.length,
        })
        for (const card of scheduled) {
          rowIndexMap.set(card.id, rows.length)
          rows.push({ kind: 'card', card, matchesSearch: matchesSearch(card) })
        }
      }
    } else {
      // flat: all scheduled cards sorted by column.position then card.position
      for (const col of sortedColumns) {
        const colCards = [...(col.cards ?? [])].sort(
          (a, b) => a.position - b.position,
        )
        for (const card of colCards.filter(isScheduled)) {
          rowIndexMap.set(card.id, rows.length)
          rows.push({ kind: 'card', card, matchesSearch: matchesSearch(card) })
        }
      }
    }

    // "No dates" group at bottom
    const noDatesCards: Card[] = []
    for (const col of sortedColumns) {
      const colCards = [...(col.cards ?? [])].sort(
        (a, b) => a.position - b.position,
      )
      noDatesCards.push(...colCards.filter((c) => !isScheduled(c)))
    }

    if (noDatesCards.length > 0) {
      rows.push({
        kind: 'lane',
        columnId: null,
        columnName: 'No dates',
        count: noDatesCards.length,
      })
      for (const card of noDatesCards) {
        rowIndexMap.set(card.id, rows.length)
        rows.push({ kind: 'card', card, matchesSearch: matchesSearch(card) })
      }
    }

    // Task 3.6: filteredDeps
    const filteredDeps = (dependencies ?? []).filter((dep) =>
      depTypeFilter.includes(dep.type),
    )

    // Task 3.7: rowIndexMap is built above during row construction

    return {
      rangeStart,
      rangeEnd,
      dayCount,
      dayWidth,
      rows,
      filteredDeps,
      rowIndexMap,
      getBarProps,
    }
  }, [board, dependencies, zoom, groupBy, searchQuery, depTypeFilter])
}
