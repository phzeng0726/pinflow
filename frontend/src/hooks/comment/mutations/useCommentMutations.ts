import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useCommentMutations(cardId: number, boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateCardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })
  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })

  const create = useMutation({
    mutationFn: (text: string) => api.createComment(cardId, text),
    onSuccess: async () => {
      await invalidateCardDetail()
    },
    onError: () => toast.error(t('toast.comment.createError')),
  })

  const update = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.updateComment(id, text),
    onSuccess: async () => {
      await invalidateCardDetail()
    },
    onError: () => toast.error(t('toast.comment.updateError')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteComment(id),
    onSuccess: async () => {
      await Promise.all([invalidateCardDetail(), invalidateBoardDetail()])
    },
    onError: () => toast.error(t('toast.comment.deleteError')),
  })

  return { create, update, remove }
}
