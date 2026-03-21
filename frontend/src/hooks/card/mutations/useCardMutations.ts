import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import type { DuplicateCardRequest } from '../../../types'
import { queryKeys } from '../../queryKeys'

export function useCardMutations(boardId = 0) {
  const qc = useQueryClient()
  const invalidateBoard = () => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidatePinned = () => qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const createCard = useMutation({
    mutationFn: ({ columnId, title, description }: { columnId: number; title: string; description: string }) =>
      api.createCard(columnId, title, description),
    onSuccess: () => { invalidateBoard(); invalidatePinned() },
  })

  const moveCard = useMutation({
    mutationFn: ({ id, columnId, position }: { id: number; columnId: number; position: number }) =>
      api.moveCard(id, columnId, position),
    onSuccess: () => { invalidateBoard(); invalidatePinned() },
  })

  const togglePin = useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: () => { invalidateBoard(); invalidatePinned() },
  })

  const updateCard = useMutation({
    mutationFn: ({ id, title, description, startTime, endTime }: {
      id: number; title: string; description: string;
      startTime?: string | null; endTime?: string | null
    }) =>
      api.updateCard(id, title, description, startTime, endTime),
    onSuccess: (_data, variables) => {
      invalidateBoard()
      qc.invalidateQueries({ queryKey: queryKeys.cards.detail(variables.id) })
    },
  })

  const deleteCard = useMutation({
    mutationFn: (id: number) => api.deleteCard(id),
    onSuccess: () => { invalidateBoard(); invalidatePinned() },
  })

  const duplicateCard = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DuplicateCardRequest }) =>
      api.duplicateCard(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
      invalidatePinned()
    },
  })

  const togglePinFromPin = useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: invalidatePinned,
  })

  return { createCard, moveCard, togglePin, updateCard, deleteCard, duplicateCard, togglePinFromPin }
}
