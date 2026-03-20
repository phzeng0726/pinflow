import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useChecklistMutations(cardId: number) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) })

  const createChecklist = useMutation({
    mutationFn: (title: string) => api.createChecklist(cardId, title),
    onSuccess: invalidate,
  })

  const deleteChecklist = useMutation({
    mutationFn: (id: number) => api.deleteChecklist(id),
    onSuccess: invalidate,
  })

  const createChecklistItem = useMutation({
    mutationFn: ({ checklistId, text }: { checklistId: number; text: string }) =>
      api.createChecklistItem(checklistId, text),
    onSuccess: invalidate,
  })

  const updateChecklistItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { text?: string; completed?: boolean; position?: number } }) =>
      api.updateChecklistItem(id, data),
    onSuccess: invalidate,
  })

  const deleteChecklistItem = useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: invalidate,
  })

  return { createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem }
}
