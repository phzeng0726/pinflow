import { queryKeys } from '@/hooks/queryKeys'
import { midPosition } from '@/lib/utils'
import type { Card, Checklist, ChecklistItem } from '@/types'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { DND_PATTERN_TYPE, DND_TYPE, parseDndId } from './dndUtils'

type ActiveDrag =
  | { kind: 'checklist'; data: Checklist }
  | { kind: 'item'; data: ChecklistItem }
  | null

interface PendingItemUpdate {
  checklistId: number
  position: number
}

interface PendingChecklistUpdate {
  id: number
  position: number
}

interface UseChecklistDndParams {
  card: Card
  sortedChecklists: Checklist[]
  moveChecklistMutate: (args: { id: number; position: number }) => void
  moveItemMutate: (args: {
    id: number
    checklistId: number
    position: number
  }) => void
}

export function useChecklistDnd(params: UseChecklistDndParams) {
  const { card, sortedChecklists, moveChecklistMutate, moveItemMutate } = params

  const qc = useQueryClient()
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const pendingItemRef = useRef<PendingItemUpdate | null>(null)
  const pendingChecklistRef = useRef<PendingChecklistUpdate | null>(null)
  const sourceChecklistRef = useRef<Checklist | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const setCardCache = (updater: (card: Card) => Card) => {
    const key = queryKeys.cards.detail(card.id)
    const prev = qc.getQueryData<Card>(key)
    if (prev) qc.setQueryData<Card>(key, updater(prev))
  }

  // ─── Drag Start ──────────────────────────────────────────────────────────────

  const handleDragStart = (e: DragStartEvent) => {
    pendingItemRef.current = null
    pendingChecklistRef.current = null

    const data = e.active.data.current

    if (data?.type === DND_TYPE.CHECKLIST) {
      setActiveDrag({ kind: 'checklist', data: data.checklist })
      return
    }

    if (data?.type === DND_TYPE.CHECKLIST_ITEM) {
      setActiveDrag({ kind: 'item', data: data.item })
      sourceChecklistRef.current =
        sortedChecklists.find((cl) =>
          cl.items.some((i) => i.id === data.item.id),
        ) ?? null
    }
  }

  // ─── Drag Cancel ─────────────────────────────────────────────────────────────

  const handleDragCancel = () => {
    setActiveDrag(null)
    pendingItemRef.current = null
    pendingChecklistRef.current = null
    sourceChecklistRef.current = null
  }

  // ─── Drag Over ───────────────────────────────────────────────────────────────

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeData = active.data.current

    // ── Checklist block 對調 ────────────────────────────────────────────────
    if (activeData?.type === DND_TYPE.CHECKLIST) {
      const dragged: Checklist = activeData.checklist
      const parsedOver = parseDndId(over.id)
      if (parsedOver.type !== DND_PATTERN_TYPE.CHECKLIST) return
      if (dragged.id === parsedOver.id) return

      const overIdx = sortedChecklists.findIndex(
        (c) => c.id === parsedOver.id,
      )
      if (overIdx === -1) return

      const before = sortedChecklists[overIdx - 1]?.position ?? null
      const after = sortedChecklists[overIdx + 1]?.position ?? null
      const position = midPosition(before, after)

      if (pendingChecklistRef.current?.position === position) return
      pendingChecklistRef.current = { id: dragged.id, position }

      setCardCache((prev) => ({
        ...prev,
        checklists: prev.checklists
          .map((cl) => (cl.id === dragged.id ? { ...cl, position } : cl))
          .sort((a, b) => a.position - b.position),
      }))
      return
    }

    // ── Checklist item ──────────────────────────────────────────────────────
    if (activeData?.type !== DND_TYPE.CHECKLIST_ITEM) return

    const draggedItem: ChecklistItem = activeData.item
    const parsedOver = parseDndId(over.id)

    let targetChecklist: Checklist | undefined
    let targetItems: ChecklistItem[]
    let overItemId: number | null = null

    if (parsedOver.type === DND_PATTERN_TYPE.CHECKLIST_ITEM_PLACEHOLDER || parsedOver.type === DND_PATTERN_TYPE.CHECKLIST) {
      targetChecklist = sortedChecklists.find((cl) => cl.id === parsedOver.id)
      if (!targetChecklist) return
      targetItems = targetChecklist.items.filter((i) => i.id !== draggedItem.id)
    } else if (parsedOver.type === DND_PATTERN_TYPE.CHECKLIST_ITEM) {
      overItemId = parsedOver.id
      targetChecklist = sortedChecklists.find((cl) =>
        cl.items.some((i) => i.id === overItemId),
      )
      if (!targetChecklist) return
      targetItems = targetChecklist.items
    } else {
      return
    }

    const sorted = [...targetItems].sort((a, b) => a.position - b.position)
    let targetIdx: number

    if (overItemId) {
      const activeIdx = sorted.findIndex((i) => i.id === draggedItem.id)
      const overIdx = sorted.findIndex((i) => i.id === overItemId)
      targetIdx =
        activeIdx !== -1 && activeIdx < overIdx ? overIdx + 1 : overIdx
    } else {
      targetIdx = sorted.length
    }

    const before = sorted[targetIdx - 1]?.position ?? null
    const after = sorted[targetIdx]?.position ?? null
    const position = midPosition(before, after)

    if (
      pendingItemRef.current?.checklistId === targetChecklist.id &&
      pendingItemRef.current?.position === position
    )
      return

    pendingItemRef.current = { checklistId: targetChecklist.id, position }

    setCardCache((prev) => ({
      ...prev,
      checklists: prev.checklists.map((cl) => {
        const nextItems = cl.items.filter((i) => i.id !== draggedItem.id)
        if (cl.id !== targetChecklist!.id) return { ...cl, items: nextItems }
        return {
          ...cl,
          items: [
            ...nextItems,
            { ...draggedItem, checklistId: targetChecklist!.id, position },
          ],
        }
      }),
    }))
  }

  // ─── Drag End ────────────────────────────────────────────────────────────────

  const handleDragEnd = (e: DragEndEvent) => {
    const activeData = e.active.data.current

    if (activeData?.type === DND_TYPE.CHECKLIST) {
      const update = pendingChecklistRef.current
      if (update) {
        moveChecklistMutate({
          id: activeData.checklist.id,
          position: update.position,
        })
      }
    } else if (activeData?.type === DND_TYPE.CHECKLIST_ITEM) {
      const update = pendingItemRef.current
      if (update) {
        moveItemMutate({
          id: activeData.item.id,
          checklistId: update.checklistId,
          position: update.position,
        })
      }
    }

    setActiveDrag(null)
    pendingItemRef.current = null
    pendingChecklistRef.current = null
    sourceChecklistRef.current = null
  }

  // ─── Expose ───────────────────────────────────────────────────────────────────

  const activeChecklist =
    activeDrag?.kind === 'checklist' ? activeDrag.data : null
  const activeItem = activeDrag?.kind === 'item' ? activeDrag.data : null

  return {
    sensors,
    activeChecklist,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
