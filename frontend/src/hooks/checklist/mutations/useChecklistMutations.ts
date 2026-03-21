import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useChecklistMutations(cardId: number) {
  const qc = useQueryClient()
  const invalidate = () => Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
    qc.invalidateQueries({ queryKey: queryKeys.boards.all() }),
  ])

  const createChecklist = useMutation({
    mutationFn: (title: string) => api.createChecklist(cardId, title),
    onSuccess: async () => {
      await invalidate()
      toast.success('清單已建立')
    },
    onError: () => toast.error('建立清單失敗'),
  })

  const deleteChecklist = useMutation({
    mutationFn: (id: number) => api.deleteChecklist(id),
    onSuccess: async () => {
      await invalidate()
      toast.success('清單已刪除')
    },
    onError: () => toast.error('刪除清單失敗'),
  })

  const createChecklistItem = useMutation({
    mutationFn: ({ checklistId, text }: { checklistId: number; text: string }) =>
      api.createChecklistItem(checklistId, text),
    onSuccess: async () => { await invalidate() },
    onError: () => toast.error('新增項目失敗'),
  })

  const updateChecklistItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { text?: string; completed?: boolean; position?: number } }) =>
      api.updateChecklistItem(id, data),
    onSuccess: async () => { await invalidate() },
    onError: () => toast.error('更新項目失敗'),
  })

  const deleteChecklistItem = useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: async () => { await invalidate() },
    onError: () => toast.error('刪除項目失敗'),
  })

  return { createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem }
}
