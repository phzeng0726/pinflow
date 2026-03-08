import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'
import { boardKeys } from './useBoards'

export const pinnedKeys = { all: ['pinned'] as const }

export function usePinnedCards() {
  return useQuery({
    queryKey: pinnedKeys.all,
    queryFn: api.getPinnedCards,
    refetchInterval: 3000,
  })
}

export function useCreateCard(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, title, description }: { columnId: number; title: string; description: string }) =>
      api.createCard(columnId, title, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      qc.invalidateQueries({ queryKey: pinnedKeys.all })
    },
  })
}

export function useMoveCard(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, columnId, position }: { id: number; columnId: number; position: number }) =>
      api.moveCard(id, columnId, position),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      qc.invalidateQueries({ queryKey: pinnedKeys.all })
    },
  })
}

export function useTogglePin(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      qc.invalidateQueries({ queryKey: pinnedKeys.all })
    },
  })
}

export function useUpdateCard(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title, description }: { id: number; title: string; description: string }) =>
      api.updateCard(id, title, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
  })
}

export function useDeleteCard(boardId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteCard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(boardId) })
      qc.invalidateQueries({ queryKey: pinnedKeys.all })
    },
  })
}

export function useTogglePinFromPin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pinnedKeys.all }),
  })
}
