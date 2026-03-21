import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { attachTag, createTag, detachTag } from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useTagMutations() {
  const qc = useQueryClient()
  const invalidateBoards = () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() })

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.tags.all() })
      toast.success('標籤已建立')
    },
    onError: () => toast.error('建立標籤失敗'),
  })

  const attach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      attachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
        invalidateBoards(),
      ])
    },
    onError: () => toast.error('新增標籤失敗'),
  })

  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      detachTag(cardId, tagId),
    onSuccess: async (_, { cardId }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
        invalidateBoards(),
      ])
    },
    onError: () => toast.error('移除標籤失敗'),
  })

  return { createTag: create, attachTag: attach, detachTag: detach }
}