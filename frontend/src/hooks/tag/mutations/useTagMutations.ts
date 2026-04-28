import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useTagMutations(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateTagsAll = () =>
    qc.invalidateQueries({ queryKey: queryKeys.tags.byBoard(boardId) })
  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = (id: number) =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(id) })
  const invalidatePinned = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const create = useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      api.createBoardTag(boardId, { name, color }),
    onSuccess: async () => {
      await invalidateTagsAll()
      toast.success(t('toast.tag.createSuccess'))
    },
    onError: () => toast.error(t('toast.tag.createError')),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { name?: string; color?: string }
    }) => api.updateTag(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateTagsAll(), invalidateBoardDetail()])
      toast.success(t('toast.tag.updateSuccess'))
    },
    onError: () => toast.error(t('toast.tag.updateError')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteTag(id),
    onSuccess: async () => {
      await Promise.all([invalidateTagsAll(), invalidateBoardDetail()])
      toast.success(t('toast.tag.deleteSuccess'))
    },
    onError: () => toast.error(t('toast.tag.deleteError')),
  })

  // 在 Card 上附上標籤
  const attach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      api.attachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([invalidateCardDetail(cardId), invalidateBoardDetail(), invalidatePinned()])
    },
    onError: () => toast.error(t('toast.tag.attachError')),
  })

  // 移除 Card 上的標籤
  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      api.detachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([invalidateCardDetail(cardId), invalidateBoardDetail(), invalidatePinned()])
    },
    onError: () => toast.error(t('toast.tag.detachError')),
  })

  return {
    createTag: create,
    updateTag: update,
    deleteTag: remove,
    attachTag: attach,
    detachTag: detach,
  }
}
