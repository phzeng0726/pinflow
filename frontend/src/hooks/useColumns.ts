import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'
import { boardKeys } from './useBoards'

export function useCreateColumn(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createColumn(boardId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}

export function useUpdateColumn(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; auto_pin?: boolean; position?: number } }) =>
      api.updateColumn(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}

export function useDeleteColumn(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteColumn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}
