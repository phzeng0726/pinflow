import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { attachTag, createTag, detachTag } from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useTagMutations() {
  const qc = useQueryClient()
  const invalidateBoardAll = () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  const invalidateTagsAll = () => qc.invalidateQueries({ queryKey: queryKeys.tags.all() })
  const invalidateCardDetail = (id: number) => qc.invalidateQueries({ queryKey: queryKeys.cards.detail(id) })

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: async () => {
      await invalidateTagsAll()
      toast.success('標籤已建立')
    },
    onError: () => toast.error('建立標籤失敗'),
  })

  const attach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      attachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([invalidateCardDetail(cardId), invalidateBoardAll()])
    },
    onError: () => toast.error('新增標籤失敗'),
  })

  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      detachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([invalidateCardDetail(cardId), invalidateBoardAll()])
    },
    onError: () => toast.error('移除標籤失敗'),
  })

  return { createTag: create, attachTag: attach, detachTag: detach }
}
