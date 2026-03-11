import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createChecklist,
  createChecklistItem,
  deleteChecklist,
  deleteChecklistItem,
  updateChecklistItem,
} from '../lib/api'

export function useCreateChecklist(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createChecklist(cardId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}

export function useDeleteChecklist(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteChecklist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}

export function useCreateChecklistItem(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ checklistId, text }: { checklistId: number; text: string }) =>
      createChecklistItem(checklistId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}

export function useUpdateChecklistItem(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { text?: string; completed?: boolean; position?: number }
    }) => updateChecklistItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}

export function useDeleteChecklistItem(cardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteChecklistItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  })
}
