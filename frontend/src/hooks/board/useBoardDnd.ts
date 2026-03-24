import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { midPosition } from '../../lib/utils'
import type { Board, Card, Column } from '../../types'
import { queryKeys } from '../queryKeys'

interface UseBoardDndParams {
  boardId: number
  columns: Column[]
  moveColumnMutate: (args: { id: number; position: number }) => void
  moveCardMutate: (args: {
    id: number
    columnId: number
    position: number
  }) => void
  onMoveOutAutoPin?: (card: Card) => void
}

export function useBoardDnd(params: UseBoardDndParams) {
  const {
    boardId,
    columns,
    moveColumnMutate,
    moveCardMutate,
    onMoveOutAutoPin,
  } = params

  const qc = useQueryClient()
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeCardDndId, setActiveCardDndId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const setBoardCache = (updater: (board: Board) => Board) => {
    const boardKey = queryKeys.boards.detail(boardId)
    const prev = qc.getQueryData<Board>(boardKey)
    if (prev) qc.setQueryData<Board>(boardKey, updater(prev))
  }

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === 'card') {
      setActiveCard(data.card)
      setActiveCardDndId(`card-${data.card.id}`)
    } else if (data?.type === 'column') {
      setActiveColumn(data.column)
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    setOverId(e.over ? String(e.over.id) : null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null)
    setActiveCardDndId(null)
    setActiveColumn(null)
    setOverId(null)

    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeData = active.data.current

    // Column reorder
    if (activeData?.type === 'column') {
      const draggedCol: Column = activeData.column
      const overIdStr = String(over.id)
      if (!overIdStr.startsWith('col-')) return
      const overColId = Number(overIdStr.replace('col-', ''))
      if (draggedCol.id === overColId) return

      const sorted = [...columns].sort((a, b) => a.position - b.position)
      const activeIdx = sorted.findIndex((c) => c.id === draggedCol.id)
      const overIdx = sorted.findIndex((c) => c.id === overColId)
      const targetIdx = activeIdx < overIdx ? overIdx + 1 : overIdx

      const before = sorted[targetIdx - 1]?.position ?? null
      const after = sorted[targetIdx]?.position ?? null
      const position = midPosition(before, after)

      // Synchronous cache update before mutate — prevents flicker
      setBoardCache((prev) => ({
        ...prev,
        columns: prev.columns?.map((col) =>
          col.id === draggedCol.id ? { ...col, position } : col,
        ),
      }))

      moveColumnMutate({ id: draggedCol.id, position })
      return
    }

    if (activeData?.type !== 'card') return

    const dragged: Card = activeData.card
    const overIdStr = String(over.id)

    let targetColumnId: number
    let targetCards: Card[]

    if (overIdStr.startsWith('card-')) {
      const overCardId = Number(overIdStr.replace('card-', ''))
      const overCol = columns.find((c) =>
        c.cards?.some((card) => card.id === overCardId),
      )
      if (!overCol) return
      targetColumnId = overCol.id
      targetCards = overCol.cards ?? []
    } else if (overIdStr.startsWith('column-drop-')) {
      targetColumnId = Number(overIdStr.replace('column-drop-', ''))
      const col = columns.find((c) => c.id === targetColumnId)
      targetCards = col?.cards ?? []
    } else {
      return
    }

    const overCardId = overIdStr.startsWith('card-')
      ? Number(overIdStr.replace('card-', ''))
      : null
    const sorted = [...targetCards].sort((a, b) => a.position - b.position)
    const overIdx = overCardId
      ? sorted.findIndex((c) => c.id === overCardId)
      : sorted.length
    const before = sorted[overIdx - 1]?.position ?? null
    const after = sorted[overIdx]?.position ?? null
    const position = midPosition(before, after)

    // Synchronous cache update before mutate — prevents flicker
    setBoardCache((prev) => ({
      ...prev,
      columns: prev.columns?.map((col) => ({
        ...col,
        cards: [
          ...(col.cards ?? []).filter((c) => c.id !== dragged.id),
          ...(col.id === targetColumnId
            ? [{ ...dragged, column_id: targetColumnId, position }]
            : []),
        ],
      })),
    }))

    moveCardMutate({ id: dragged.id, columnId: targetColumnId, position })

    if (onMoveOutAutoPin && targetColumnId !== dragged.column_id) {
      const sourceCol = columns.find((c) => c.id === dragged.column_id)
      if (sourceCol?.auto_pin && dragged.is_pinned) {
        onMoveOutAutoPin(dragged)
      }
    }
  }

  return {
    sensors,
    activeCard,
    activeCardDndId,
    activeColumn,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
