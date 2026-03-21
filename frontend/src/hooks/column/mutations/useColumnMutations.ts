import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useColumnMutations(boardId: number) {
  const qc = useQueryClient()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })

  const create = useMutation({
    mutationFn: (name: string) => api.createColumn(boardId, name),
    onSuccess: async () => {
      await invalidateBoardDetail()
      toast.success('欄位已建立')
    },
    onError: () => toast.error('建立欄位失敗'),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { name?: string; auto_pin?: boolean; position?: number }
    }) => api.updateColumn(id, data),
    onError: () => toast.error('更新欄位失敗'),
    onSettled: async () => {
      await invalidateBoardDetail()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteColumn(id),
    onSuccess: async () => {
      await invalidateBoardDetail()
      toast.success('欄位已刪除')
    },
    onError: () => toast.error('刪除欄位失敗'),
  })

  return {
    createColumn: create,
    updateColumn: update,
    deleteColumn: remove,
  }
}
