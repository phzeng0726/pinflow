import { queryKeys } from '@/hooks/queryKeys'
import * as api from '@/lib/api'
import type { Card, ChecklistItem } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function useChecklistMutations(boardId: number, cardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })
  const invalidatePinnedCards = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const createList = useMutation({
    mutationFn: (title: string) => api.createChecklist(cardId, title),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
      toast.success(t('toast.checklist.listCreated'))
    },
    onError: () => toast.error(t('toast.checklist.listCreateError')),
  })

  const updateList = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { title?: string; position?: number }
    }) => api.updateChecklist(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error(t('toast.checklist.listUpdateError')),
  })

  const deleteList = useMutation({
    mutationFn: (id: number) => api.deleteChecklist(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail(), invalidatePinnedCards()])
      toast.success(t('toast.checklist.listDeleted'))
    },
    onError: () => toast.error(t('toast.checklist.listDeleteError')),
  })

  const createItem = useMutation({
    mutationFn: ({
      checklistId,
      text,
    }: {
      checklistId: number
      text: string
    }) => api.createChecklistItem(checklistId, text),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail(), invalidatePinnedCards()])
    },
    onError: () => toast.error(t('toast.checklist.itemCreateError')),
  })

  const updateItem = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { text?: string; completed?: boolean; position?: number }
    }) => api.updateChecklistItem(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail(), invalidatePinnedCards()])
    },
    onError: () => toast.error(t('toast.checklist.itemUpdateError')),
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail(), invalidatePinnedCards()])
    },
    onError: () => toast.error(t('toast.checklist.itemDeleteError')),
  })

  const syncItems = useMutation({
    mutationFn: ({
      checklistId,
      items,
    }: {
      checklistId: number
      items: { text: string; completed: boolean }[]
    }) => api.syncChecklistItems(checklistId, items),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail(), invalidatePinnedCards()])
      toast.success(t('toast.checklist.itemsSynced'))
    },
    onError: () => toast.error(t('toast.checklist.itemsSyncError')),
  })

  const moveChecklist = useMutation({
    mutationFn: ({ id, position }: { id: number; position: number }) =>
      api.updateChecklist(id, { position }),
    onSuccess: async () => {
      await invalidateCardDetail()
    },
    onError: async () => {
      await invalidateCardDetail()
      toast.error(t('toast.checklist.listUpdateError'))
    },
  })

  const moveChecklistItem = useMutation({
    mutationFn: ({
      id,
      checklistId,
      position,
    }: {
      id: number
      checklistId: number
      position: number
    }) => api.moveChecklistItem(id, { checklistId, position }),
    onMutate: async ({ id, checklistId, position }) => {
      const cardKey = queryKeys.cards.detail(cardId)
      await qc.cancelQueries({ queryKey: cardKey })
      const snapshot = qc.getQueryData(cardKey)
      qc.setQueryData<Card>(cardKey, (prev) => {
        if (!prev) return prev
        let movedItem: ChecklistItem | undefined
        const checklists = prev.checklists.map((cl) => ({
          ...cl,
          items: cl.items.filter((item) => {
            if (item.id === id) {
              movedItem = { ...item, checklistId, position }
              return false
            }
            return true
          }),
        }))
        if (movedItem) {
          return {
            ...prev,
            checklists: checklists.map((cl) =>
              cl.id === checklistId
                ? {
                    ...cl,
                    items: [...cl.items, movedItem!].sort(
                      (a, b) => a.position - b.position,
                    ),
                  }
                : cl,
            ),
          }
        }
        return prev
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(queryKeys.cards.detail(cardId), ctx.snapshot)
      }
      toast.error(t('toast.checklist.itemUpdateError'))
    },
    onSettled: () => {
      setTimeout(() => invalidateCardDetail(), 300)
    },
  })

  return {
    createChecklist: createList,
    updateChecklist: updateList,
    deleteChecklist: deleteList,
    createChecklistItem: createItem,
    updateChecklistItem: updateItem,
    deleteChecklistItem: deleteItem,
    syncChecklistItems: syncItems,
    moveChecklist,
    moveChecklistItem,
  }
}
