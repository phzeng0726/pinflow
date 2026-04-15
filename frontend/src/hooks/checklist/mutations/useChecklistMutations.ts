import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useChecklistMutations(boardId: number, cardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })

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
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
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
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
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
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error(t('toast.checklist.itemUpdateError')),
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error(t('toast.checklist.itemDeleteError')),
  })

  return {
    createChecklist: createList,
    updateChecklist: updateList,
    deleteChecklist: deleteList,
    createChecklistItem: createItem,
    updateChecklistItem: updateItem,
    deleteChecklistItem: deleteItem,
  }
}
