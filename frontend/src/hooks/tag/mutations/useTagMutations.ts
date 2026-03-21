import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useTagMutations(boardId: number) {
  const qc = useQueryClient()

  const invalidateTagsAll = () => qc.invalidateQueries({ queryKey: queryKeys.tags.all() })
  const invalidateBoardDetail = () => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = (id: number) => qc.invalidateQueries({ queryKey: queryKeys.cards.detail(id) })

  const create = useMutation({
    mutationFn: api.createTag,
    onSuccess: async () => {
      await invalidateTagsAll()
      toast.success('標籤已建立')
    },
    onError: () => toast.error('建立標籤失敗'),
  })

  // 在 Card 上附上標籤
  const attach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      api.attachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([
        invalidateCardDetail(cardId),
        invalidateBoardDetail(),
      ])
    },
    onError: () => toast.error('新增標籤失敗'),
  })

  // 移除 Card 上的標籤
  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      api.detachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([
        invalidateCardDetail(cardId),
        invalidateBoardDetail(),
      ])
    },
    onError: () => toast.error('移除標籤失敗'),
  })

  return {
    createTag: create,
    attachTag: attach,
    detachTag: detach
  }
}
