import { queryKeys } from '@/hooks/queryKeys'
import * as api from '@/lib/api'
import { midPosition } from '@/lib/utils'
import type { Board } from '@/types'
import { arrayMove } from '@dnd-kit/sortable'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { DND_TYPE } from './dndUtils'

interface UseBoardListDndParams {
  boards: Board[]
  moveBoardMutate: (args: { id: number; position: number }) => void
}

export function useBoardListDnd(params: UseBoardListDndParams) {
  const { boards, moveBoardMutate } = params
  const qc = useQueryClient()
  const { t } = useTranslation()

  const [activeBoard, setActiveBoard] = useState<Board | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Sort by (position ASC, id ASC); normalize to virtual positions if all are 0
  const sortedBoards = [...boards].sort((a, b) =>
    a.position !== b.position ? a.position - b.position : a.id - b.id,
  )
  const hasRealPositions = sortedBoards.some((b) => b.position > 0)
  const displayBoards = hasRealPositions
    ? sortedBoards
    : sortedBoards.map((b, i) => ({ ...b, position: (i + 1) * 2 }))

  const setBoardListCache = (updater: (boards: Board[]) => Board[]) => {
    const key = queryKeys.boards.all()
    const prev = qc.getQueryData<Board[]>(key)
    if (prev) qc.setQueryData<Board[]>(key, updater(prev))
  }

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === DND_TYPE.BOARD) {
      setActiveBoard(data.board)
    }
  }

  const handleDragCancel = () => {
    setActiveBoard(null)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveBoard(null)

    if (!over || active.id === over.id) return

    const activeId = Number(active.id)
    const overId = Number(over.id)

    const activeIndex = displayBoards.findIndex((b) => b.id === activeId)
    const overIndex = displayBoards.findIndex((b) => b.id === overId)

    if (activeIndex === -1 || overIndex === -1) return

    const newOrder = arrayMove(displayBoards, activeIndex, overIndex)
    const movedIdx = newOrder.findIndex((b) => b.id === activeId)

    if (!hasRealPositions) {
      // 首次使用（所有 boards 尚無排序位置）：批次指派 sequential positions
      const updates = newOrder.map((b, i) => ({ id: b.id, position: (i + 1) * 2 }))

      setBoardListCache((prev) =>
        prev.map((b) => {
          const upd = updates.find((u) => u.id === b.id)
          return upd ? { ...b, position: upd.position } : b
        }),
      )

      try {
        await Promise.all(updates.map((u) => api.moveBoard(u.id, u.position)))
        await qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
      } catch {
        toast.error(t('toast.board.updateError'))
        await qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
      }
    } else {
      // 正常情況：只更新移動的 board，用 midPosition 算出新位置
      const before = newOrder[movedIdx - 1]?.position ?? null
      const after = newOrder[movedIdx + 1]?.position ?? null
      const newPosition = midPosition(before, after)

      setBoardListCache((prev) =>
        prev.map((b) => (b.id === activeId ? { ...b, position: newPosition } : b)),
      )

      moveBoardMutate({ id: activeId, position: newPosition })
    }
  }

  return {
    sensors,
    activeBoard,
    displayBoards,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
