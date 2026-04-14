import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useCommentMutations(cardId: number, boardId: number) {
  const qc = useQueryClient()

  const invalidateCardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })
  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })

  const create = useMutation({
    mutationFn: (text: string) => api.createComment(cardId, text),
    onSuccess: async () => {
      await invalidateCardDetail()
    },
    onError: () => toast.error('新增留言失敗'),
  })

  const update = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.updateComment(id, text),
    onSuccess: async () => {
      await invalidateCardDetail()
    },
    onError: () => toast.error('更新留言失敗'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteComment(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error('刪除留言失敗'),
  })

  return { create, update, remove }
}
