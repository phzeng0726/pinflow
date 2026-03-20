import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attachTag, createTag, detachTag } from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useTagMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags.all() }),
  })

  const attach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      attachTag(cardId, tagId),
    onSuccess: (_, { cardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
  })

  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      detachTag(cardId, tagId),
    onSuccess: (_, { cardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
  })

  return { createTag: create, attachTag: attach, detachTag: detach }
}