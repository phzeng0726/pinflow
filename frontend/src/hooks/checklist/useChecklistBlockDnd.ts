import { queryKeys } from '@/hooks/queryKeys'
import { midPosition } from '@/lib/utils'
import type { Card, Checklist } from '@/types'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface UseChecklistBlockDndParams {
  card: Card
  moveMutate: (args: { id: number; position: number }) => void
}

export function useChecklistBlockDnd(params: UseChecklistBlockDndParams) {
  const { card, moveMutate } = params

  const qc = useQueryClient()
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const setCardCache = (updater: (card: Card) => Card) => {
    const cardKey = queryKeys.cards.detail(card.id)
    const prev = qc.getQueryData<Card>(cardKey)
    if (prev) qc.setQueryData<Card>(cardKey, updater(prev))
  }

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === 'checklist') {
      setActiveChecklist(data.checklist)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveChecklist(null)

    const { active, over } = e

    if (!over || active.id === over.id) return

    const activeData = active.data.current

    if (activeData?.type !== 'checklist') return

    const draggedChecklist: Checklist = activeData.checklist
    const overIdStr = String(over.id)
    if (!overIdStr.startsWith('checklist-')) return
    const overColId = Number(overIdStr.replace('checklist-', ''))
    if (draggedChecklist.id === overColId) return

    const sorted = [...card.checklists].sort((a, b) => a.position - b.position)
    const activeIdx = sorted.findIndex((c) => c.id === draggedChecklist.id)
    const overIdx = sorted.findIndex((c) => c.id === overColId)
    const targetIdx = activeIdx < overIdx ? overIdx + 1 : overIdx

    const before = sorted[targetIdx - 1]?.position ?? null
    const after = sorted[targetIdx]?.position ?? null
    const position = midPosition(before, after)

    // Synchronous cache update before mutate — prevents flicker
    setCardCache((prev) => ({
      ...prev,
      checklists: prev.checklists
        ?.map((cl) =>
          cl.id === draggedChecklist.id ? { ...cl, position } : cl,
        )
        .sort((a, b) => a.position - b.position),
    }))

    moveMutate({ id: draggedChecklist.id, position })
  }

  return {
    sensors,
    activeChecklist,
    handleDragStart,
    handleDragEnd,
  }
}
