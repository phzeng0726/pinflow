import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useBoardMutations() {
  const qc = useQueryClient()

  const invalidateBoardAll = () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  const invalidateBoardDetail = (id: number) => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(id) })

  const create = useMutation({
    mutationFn: (name: string) => api.createBoard(name),
    onSuccess: () => {
      invalidateBoardAll()
      toast.success('看板已建立')
    },
    onError: () => toast.error('建立看板失敗'),
  })

  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.updateBoard(id, name),
    onSuccess: async (data) => {
      await Promise.all([
        invalidateBoardAll(),
        invalidateBoardDetail(data.id),
      ])
      toast.success('看板已更新')
    },
    onError: () => toast.error('更新看板失敗'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onSuccess: () => {
      invalidateBoardAll()
      toast.success('看板已刪除')
    },
    onError: () => toast.error('刪除看板失敗'),
  })

  return { createBoard: create, updateBoard: update, deleteBoard: remove }
}
