import { queryKeys } from '@/hooks/queryKeys'
import { midPosition } from '@/lib/utils'
import type { Card, Checklist, ChecklistItem } from '@/types'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface UseChecklistItemDndParams {
  boardId: number
  cardId: number
  checklist: Checklist
  moveMutate: (args: { id: number; position: number }) => void
}

export function useChecklistItemDnd(params: UseChecklistItemDndParams) {
  const { cardId, checklist, moveMutate } = params

  const qc = useQueryClient()
  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const setCardCache = (updater: (card: Card) => Card) => {
    const cardKey = queryKeys.cards.detail(cardId)
    const prev = qc.getQueryData<Card>(cardKey)
    if (prev) qc.setQueryData<Card>(cardKey, updater(prev))
  }

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === 'checklist-item') {
      setActiveItem(data.item)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveItem(null)

    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeData = active.data.current

    if (activeData?.type !== 'checklist-item') return

    const draggedItem: ChecklistItem = activeData.item
    const overIdStr = String(over.id)
    if (!overIdStr.startsWith('checklist-item-')) return
    const overItemId = Number(overIdStr.replace('checklist-item-', ''))
    if (draggedItem.id === overItemId) return

    const sorted = [...checklist.items].sort((a, b) => a.position - b.position)
    const activeIdx = sorted.findIndex((c) => c.id === draggedItem.id)
    const overIdx = sorted.findIndex((c) => c.id === overItemId)
    const targetIdx = activeIdx < overIdx ? overIdx + 1 : overIdx

    const before = sorted[targetIdx - 1]?.position ?? null
    const after = sorted[targetIdx]?.position ?? null
    const position = midPosition(before, after)

    // Synchronous cache update before mutate — prevents flicker
    setCardCache((prev) => ({
      ...prev,
      checklists: prev.checklists
        ?.map((cl) =>
          cl.id === checklist.id
            ? {
                ...cl,
                items: cl.items
                  .map((item) =>
                    item.id === draggedItem.id ? { ...item, position } : item,
                  )
                  .sort((a, b) => a.position - b.position),
              }
            : cl,
        )
        .sort((a, b) => a.position - b.position),
    }))

    moveMutate({ id: draggedItem.id, position })
  }

  return {
    sensors,
    activeItem,
    handleDragStart,
    handleDragEnd,
  }
}
