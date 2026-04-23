import { queryKeys } from '@/hooks/queryKeys'
import { midPosition } from '@/lib/utils'
import type { Board, Card, Column } from '@/types'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { DND_PATTERN_TYPE, DND_TYPE, parseDndId } from './dndUtils'

interface CardDndPosition {
  columnId: number
  position: number
}

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
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const sourceColumnRef = useRef<Column | null>(null) // 紀錄 Card 拖曳前所在的欄位
  const pendingCardUpdateRef = useRef<CardDndPosition | null>(null) // 紀錄 Card 拖曳過程中計算出的最新目標狀態

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
    switch (data?.type) {
      case DND_TYPE.CARD:
        setActiveCard(data.card)
        const startCol = columns.find((c) => c.id === data.card.columnId)
        sourceColumnRef.current = startCol ?? null
        break
      case DND_TYPE.COLUMN:
        setActiveColumn(data.column)
        break
    }
    pendingCardUpdateRef.current = null
  }

  const handleDragCancel = () => {
    setActiveCard(null)
    setActiveColumn(null)
    pendingCardUpdateRef.current = null
  }

  // 拖曳卡片過程中隨時更新目標位置
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return

    const activeData = active.data.current
    if (activeData?.type !== DND_TYPE.CARD) return

    const dragged: Card = activeData.card
    const parsedOver = parseDndId(over.id)

    let targetColumnId: number
    let targetCards: Card[]
    let overCardId: number | null = null

    // 1. 判定目標 Column 與 Card
    switch (parsedOver.type) {
      case DND_PATTERN_TYPE.CARD:
        overCardId = parsedOver.id
        const overCol = columns.find((c) =>
          c.cards?.some((card) => card.id === overCardId),
        )
        if (!overCol) return
        targetColumnId = overCol.id
        targetCards = overCol.cards ?? []
        break

      case DND_PATTERN_TYPE.COLUMN_DROP:
        targetColumnId = parsedOver.id
        const col = columns.find((c) => c.id === targetColumnId)
        if (!col) return
        targetCards = col.cards ?? []
        break

      default:
        return
    }

    // 2. 計算 Position
    const sorted = [...targetCards].sort((a, b) => a.position - b.position)
    let targetIdx: number
    if (overCardId) {
      const activeIdx = sorted.findIndex((c) => c.id === dragged.id)
      const overIdx = sorted.findIndex((c) => c.id === overCardId)
      targetIdx =
        activeIdx !== -1 && activeIdx < overIdx ? overIdx + 1 : overIdx
    } else {
      targetIdx = sorted.length
    }

    const before = sorted[targetIdx - 1]?.position ?? null
    const after = sorted[targetIdx]?.position ?? null
    const position = midPosition(before, after)

    // 3. 檢查是否真的需要更新 (避免過度重複渲染)
    const isSamePosition =
      pendingCardUpdateRef.current?.columnId === targetColumnId &&
      pendingCardUpdateRef.current?.position === position

    if (isSamePosition) return

    // 4. 更新暫存 Ref
    pendingCardUpdateRef.current = {
      columnId: targetColumnId,
      position,
    }

    // 5. 更新 UI 緩存 (讓卡片即時在畫面上移動)
    setBoardCache((prev) => ({
      ...prev,
      columns: prev.columns?.map((col) => {
        const nextCards = (col.cards ?? []).filter((c) => c.id !== dragged.id)
        if (col.id !== targetColumnId) return { ...col, cards: nextCards }

        return {
          ...col,
          cards: [
            ...nextCards,
            { ...dragged, columnId: targetColumnId, position },
          ],
        }
      }),
    }))
  }

  // 移動 Card 並儲存位子 (直接從 pendingCardUpdateRef 獲取最新目標位置，就不用重新計算了)
  const handleCardMove = (dragged: Card) => {
    const update = pendingCardUpdateRef.current
    const sourceCol = sourceColumnRef.current

    if (!update) return

    // 執行 API 請求
    moveCardMutate({
      id: dragged.id,
      columnId: update.columnId,
      position: update.position,
    })

    // 處理 Auto Pin 彈窗邏輯
    const shouldShowPinModal =
      onMoveOutAutoPin &&
      sourceCol?.autoPin &&
      dragged.isPinned &&
      update.columnId !== sourceCol.id

    if (shouldShowPinModal) {
      onMoveOutAutoPin(dragged)
    }
  }

  // 移動 Column 並儲存位子
  const handleColumnMove = (active: Active, over: Over | null) => {
    if (!over || active.id === over.id) return

    const parsedOver = parseDndId(over.id)
    if (parsedOver.type !== DND_PATTERN_TYPE.COLUMN_HANDLE) return

    const dragged = active.data.current?.column as Column
    const sorted = [...columns].sort((a, b) => a.position - b.position)

    const activeIdx = sorted.findIndex((c) => c.id === dragged.id)
    const overIdx = sorted.findIndex((c) => c.id === parsedOver.id)
    const targetIdx = activeIdx < overIdx ? overIdx + 1 : overIdx

    const position = midPosition(
      sorted[targetIdx - 1]?.position ?? null,
      sorted[targetIdx]?.position ?? null,
    )

    // 更新 UI 緩存與後端
    setBoardCache((prev) => ({
      ...prev,
      columns: prev.columns?.map((col) =>
        col.id === dragged.id ? { ...col, position } : col,
      ),
    }))
    moveColumnMutate({ id: dragged.id, position })
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    const activeData = active.data.current

    if (!activeData) {
      handleDragCancel()
      return
    }

    switch (activeData.type) {
      case DND_TYPE.COLUMN:
        handleColumnMove(active, over)
        break

      case DND_TYPE.CARD:
        handleCardMove(activeData.card)
        break
    }

    // 清空狀態
    setActiveCard(null)
    setActiveColumn(null)
    pendingCardUpdateRef.current = null
    sourceColumnRef.current = null
  }

  return {
    sensors,
    activeCard,
    activeColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  }
}
