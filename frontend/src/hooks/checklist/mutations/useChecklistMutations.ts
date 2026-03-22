import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useChecklistMutations(boardId: number, cardId: number) {
  const qc = useQueryClient()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })

  const createList = useMutation({
    mutationFn: (title: string) => api.createChecklist(cardId, title),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
      toast.success('清單已建立')
    },
    onError: () => toast.error('建立清單失敗'),
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
    onError: () => toast.error('更新清單失敗'),
  })

  const deleteList = useMutation({
    mutationFn: (id: number) => api.deleteChecklist(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
      toast.success('清單已刪除')
    },
    onError: () => toast.error('刪除清單失敗'),
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
    onError: () => toast.error('新增項目失敗'),
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
    onError: () => toast.error('更新項目失敗'),
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error('刪除項目失敗'),
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
