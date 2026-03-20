import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useBoardMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (name: string) => api.createBoard(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() }),
  })

  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.updateBoard(id, name),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
      qc.invalidateQueries({ queryKey: queryKeys.boards.detail(data.id) })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() }),
  })

  return { createBoard: create, updateBoard: update, deleteBoard: remove }
}
