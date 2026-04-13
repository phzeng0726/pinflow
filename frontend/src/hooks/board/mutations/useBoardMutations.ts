import type { NewOrEditBoardForm } from '@/lib/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useBoardMutations() {
  const qc = useQueryClient()

  const invalidateBoardAll = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  const invalidateBoardDetail = (id: number) =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(id) })

  const create = useMutation({
    mutationFn: (form: NewOrEditBoardForm) => api.createBoard(form),
    onSuccess: async () => {
      await invalidateBoardAll()
      toast.success('看板已建立')
    },
    onError: () => toast.error('建立看板失敗'),
  })

  const update = useMutation({
    mutationFn: (props: { id: number; form: NewOrEditBoardForm }) => {
      const { id, form } = props
      return api.updateBoard(id, form)
    },
    onSuccess: async (data) => {
      await Promise.all([invalidateBoardAll(), invalidateBoardDetail(data.id)])
      toast.success('看板已更新')
    },
    onError: () => toast.error('更新看板失敗'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onSuccess: async () => {
      await invalidateBoardAll()
      toast.success('看板已刪除')
    },
    onError: () => toast.error('刪除看板失敗'),
  })

  return {
    createBoard: create,
    updateBoard: update,
    deleteBoard: remove,
  }
}
