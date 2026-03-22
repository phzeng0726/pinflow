import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import * as api from '../../lib/api'
import { midPosition } from '../../lib/utils'
import type { Card, Checklist } from '../../types'
import { queryKeys } from '../queryKeys'

interface UseChecklistDndParams {
  boardId: number
  cardId: number
  checklists: Checklist[]
}

export function useChecklistDnd(params: UseChecklistDndParams) {
  const { boardId, cardId, checklists } = params
  const qc = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const setCardCache = (updater: (card: Card) => Card) => {
    const cardKey = queryKeys.cards.detail(cardId)
    const prev = qc.getQueryData<Card>(cardKey)
    if (prev) qc.setQueryData<Card>(cardKey, updater(prev))
  }

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
      qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
    ])

  const handleChecklistDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Checklist reorder
    if (
      activeId.startsWith('checklist-') &&
      !activeId.startsWith('checklist-item-')
    ) {
      const clId = Number(activeId.replace('checklist-', ''))
      const overClId = Number(overId.replace('checklist-', ''))

      const sorted = [...checklists].sort((a, b) => a.position - b.position)
      const oldIndex = sorted.findIndex((cl) => cl.id === clId)
      const newIndex = sorted.findIndex((cl) => cl.id === overClId)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(sorted, oldIndex, newIndex)
      const before =
        newIndex > 0 ? reordered[newIndex - 1].position : null
      const after =
        newIndex < reordered.length - 1
          ? reordered[newIndex + 1].position
          : null
      const newPosition = midPosition(before, after)

      setCardCache((card) => ({
        ...card,
        checklists: card.checklists.map((cl) =>
          cl.id === clId ? { ...cl, position: newPosition } : cl,
        ),
      }))

      api.updateChecklist(clId, { position: newPosition }).catch(() => {
        invalidate()
      })
      return
    }

    // Checklist item reorder
    if (activeId.startsWith('checklist-item-')) {
      const itemId = Number(activeId.replace('checklist-item-', ''))
      const overItemId = Number(overId.replace('checklist-item-', ''))

      const checklist = checklists.find((cl) =>
        cl.items.some((item) => item.id === itemId),
      )
      if (!checklist) return

      const sorted = [...checklist.items].sort(
        (a, b) => a.position - b.position,
      )
      const oldIndex = sorted.findIndex((item) => item.id === itemId)
      const newIndex = sorted.findIndex((item) => item.id === overItemId)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(sorted, oldIndex, newIndex)
      const before =
        newIndex > 0 ? reordered[newIndex - 1].position : null
      const after =
        newIndex < reordered.length - 1
          ? reordered[newIndex + 1].position
          : null
      const newPosition = midPosition(before, after)

      setCardCache((card) => ({
        ...card,
        checklists: card.checklists.map((cl) =>
          cl.id === checklist.id
            ? {
                ...cl,
                items: cl.items.map((item) =>
                  item.id === itemId
                    ? { ...item, position: newPosition }
                    : item,
                ),
              }
            : cl,
        ),
      }))

      api
        .updateChecklistItem(itemId, { position: newPosition })
        .catch(() => {
          invalidate()
        })
    }
  }

  return { sensors, handleChecklistDragEnd }
}
