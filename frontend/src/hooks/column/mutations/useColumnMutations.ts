import type { EditColumnForm, NewColumnForm } from '@/lib/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useColumnMutations(boardId: number) {
  const qc = useQueryClient()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })

  const create = useMutation({
    mutationFn: (form: NewColumnForm) => api.createColumn(boardId, form),
    onSuccess: async () => {
      await invalidateBoardDetail()
      toast.success('欄位已建立')
    },
    onError: () => toast.error('建立欄位失敗'),
  })

  const update = useMutation({
    mutationFn: (props: { id: number; form: EditColumnForm }) => {
      const { id, form } = props
      return api.updateColumn(id, form)
    },
    onSuccess: async () => {
      await invalidateBoardDetail()
      toast.success('欄位已更新')
    },
    onError: () => toast.error('更新欄位失敗'),
  })

  const move = useMutation({
    mutationFn: (props: { id: number; position: number }) => {
      const { id, position } = props
      return api.moveColumn(id, position)
    },
    onSuccess: async () => {
      await invalidateBoardDetail()
    },
    onError: () => toast.error('移動欄位失敗'),
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
    moveColumn: move,
    deleteColumn: remove,
  }
}
