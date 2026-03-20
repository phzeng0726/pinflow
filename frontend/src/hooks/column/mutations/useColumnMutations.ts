import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useColumnMutations(boardId: number) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })

  const create = useMutation({
    mutationFn: (name: string) => api.createColumn(boardId, name),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; auto_pin?: boolean; position?: number } }) =>
      api.updateColumn(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteColumn(id),
    onSuccess: invalidate,
  })

  return { createColumn: create, updateColumn: update, deleteColumn: remove }
}
