import { getDependencyEdgeStyle } from '@/lib/styleConfig'
import { useTimelineStore } from '@/stores/timelineStore'
import type { Card, Dependency } from '@/types'
import type { BarProps } from './useTimelineData'
import { ROW_HEIGHT } from './useTimelineData'

interface TimelineArrowsProps {
  filteredDeps: Dependency[]
  rowIndexMap: Map<number, number>
  getBarProps: (card: Card) => BarProps
  allCards: Map<number, Card>
  totalWidth: number
  totalHeight: number
}

export function TimelineArrows({
  filteredDeps,
  rowIndexMap,
  getBarProps,
  allCards,
  totalWidth,
  totalHeight,
}: TimelineArrowsProps) {
  const depMode = useTimelineStore((s) => s.depMode)
  const hoveredCardId = useTimelineStore((s) => s.hoveredCardId)

  if (depMode === 'off') return null
  if (depMode === 'hover' && hoveredCardId === null) return null

  const paths: React.ReactNode[] = []

  for (const dep of filteredDeps) {
    const fromCard = allCards.get(dep.fromCard.id)
    const toCard = allCards.get(dep.toCard.id)
    if (!fromCard || !toCard) continue

    if (
      depMode === 'hover' &&
      dep.fromCard.id !== hoveredCardId &&
      dep.toCard.id !== hoveredCardId
    ) {
      continue
    }

    const fromRowIndex = rowIndexMap.get(dep.fromCard.id)
    const toRowIndex = rowIndexMap.get(dep.toCard.id)
    if (fromRowIndex === undefined || toRowIndex === undefined) continue

    const fromBarProps = getBarProps(fromCard)
    const toBarProps = getBarProps(toCard)

    // from-bar right edge
    const fromX = fromBarProps.hasSchedule
      ? fromBarProps.left + fromBarProps.width
      : 4 + 120
    const fromY = fromRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2

    // to-bar left edge
    const toX = toBarProps.hasSchedule ? toBarProps.left : 4
    const toY = toRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2

    // Elbow path: from-bar right → right 12px → vertical to toY → to-bar left
    const midX = fromX + 12
    const d = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`

    const style = getDependencyEdgeStyle(dep.type)
    const opacity = depMode === 'hover' ? 1 : 0.75
    const markerId = `tl-arrow-${dep.type}`

    paths.push(
      <path
        key={dep.id}
        d={d}
        stroke={style.stroke}
        strokeWidth={1.5}
        strokeDasharray={style.strokeDasharray}
        fill="none"
        opacity={opacity}
        markerEnd={style.markerEnd ? `url(#${markerId})` : undefined}
      />,
    )
  }

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Task 10.2: arrow markers */}
        <marker
          id="tl-arrow-blocks"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
        </marker>
        <marker
          id="tl-arrow-parent_of"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
        </marker>
      </defs>
      {paths}
    </svg>
  )
}
