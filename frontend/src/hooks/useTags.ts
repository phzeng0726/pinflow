import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attachTag, createTag, detachTag, listTags } from '../lib/api'

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: listTags })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useAttachTag(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tagId: number) => attachTag(cardId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}

export function useDetachTag(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tagId: number) => detachTag(cardId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}
