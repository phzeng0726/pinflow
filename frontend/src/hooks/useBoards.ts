import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'

export const boardKeys = {
  all: ['boards'] as const,
  detail: (id: number) => ['boards', id] as const,
}

export function useBoards() {
  return useQuery({ queryKey: boardKeys.all, queryFn: api.getBoards })
}

export function useBoard(id: number) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => api.getBoard(id),
    enabled: id > 0,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createBoard(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  })
}

export function useUpdateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.updateBoard(id, name),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: boardKeys.all })
      qc.invalidateQueries({ queryKey: boardKeys.detail(data.id) })
    },
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  })
}
