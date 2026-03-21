import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../../../lib/api'
import type { DuplicateCardRequest } from '../../../types'
import { queryKeys } from '../../queryKeys'

export function useCardMutations(boardId = 0) {
  const qc = useQueryClient()
  const invalidateBoardAll = () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  const invalidateBoardDetail = () => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateCardDetail = (id: number) => qc.invalidateQueries({ queryKey: queryKeys.cards.detail(id) })
  const invalidatePinned = () => qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const create = useMutation({
    mutationFn: ({ columnId, title, description }: { columnId: number; title: string; description: string }) =>
      api.createCard(columnId, title, description),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success('卡片已建立')
    },
    onError: () => toast.error('建立卡片失敗'),
  })

  const move = useMutation({
    mutationFn: ({ id, columnId, position }: { id: number; columnId: number; position: number }) =>
      api.moveCard(id, columnId, position),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
    },
    onError: async () => {
      await invalidateBoardDetail()
      toast.error('移動卡片失敗')
    },
  })

  const togglePin = useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: async (data) => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success(data.is_pinned ? '已釘選' : '已取消釘選')
    },
    onError: () => toast.error('切換釘選失敗'),
  })

  const update = useMutation({
    mutationFn: ({ id, title, description, startTime, endTime }: {
      id: number; title: string; description: string;
      startTime?: string | null; endTime?: string | null
    }) =>
      api.updateCard(id, title, description, startTime, endTime),
    onSuccess: async (_data, variables) => {
      await Promise.all([invalidateBoardDetail(), invalidateCardDetail(variables.id)])
      toast.success('卡片已更新')
    },
    onError: () => toast.error('更新卡片失敗'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCard(id),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success('卡片已刪除')
    },
    onError: () => toast.error('刪除卡片失敗'),
  })

  const duplicate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DuplicateCardRequest }) =>
      api.duplicateCard(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateBoardAll(), invalidatePinned()])
      toast.success('卡片已複製')
    },
    onError: () => toast.error('複製卡片失敗'),
  })

  const togglePinFromPin = useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: async (data) => {
      await Promise.all([invalidateBoardAll(), invalidatePinned()])
      toast.success(data.is_pinned ? '已釘選' : '已取消釘選')
    },
    onError: () => toast.error('切換釘選失敗'),
  })

  return { createCard: create, moveCard: move, togglePin, updateCard: update, deleteCard: remove, duplicateCard: duplicate, togglePinFromPin }
}
