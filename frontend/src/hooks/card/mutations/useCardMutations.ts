import type { EditCardForm, NewCardForm } from '@/lib/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { DuplicateCardRequest } from '@/types'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useCardMutations(boardId?: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateBoardDetail = () =>
    boardId != null
      ? qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      : Promise.resolve()
  const invalidateCardDetail = (id: number) =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.detail(id) })
  const invalidatePinned = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const create = useMutation({
    mutationFn: (props: { columnId: number; form: NewCardForm }) => {
      const { columnId, form } = props
      return api.createCard(columnId, form)
    },
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success(t('toast.card.createSuccess'))
    },
    onError: () => toast.error(t('toast.card.createError')),
  })

  const move = useMutation({
    mutationFn: ({
      id,
      columnId,
      position,
    }: {
      id: number
      columnId: number
      position: number
    }) => api.moveCard(id, columnId, position),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
    },
    onError: async () => {
      await invalidateBoardDetail()
      toast.error(t('toast.card.moveError'))
    },
  })

  const togglePin = useMutation({
    mutationFn: (id: number) => api.togglePin(id),
    onSuccess: async (data) => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success(data.isPinned ? t('toast.card.pinned') : t('toast.card.unpinned'))
    },
    onError: () => toast.error(t('toast.card.togglePinError')),
  })

  const update = useMutation({
    mutationFn: (props: { id: number; form: EditCardForm }) => {
      const { id, form } = props
      return api.updateCard(id, form)
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateBoardDetail(),
        invalidateCardDetail(variables.id),
        invalidatePinned(),
      ])
      toast.success(t('toast.card.updateSuccess'))
    },
    onError: () => toast.error(t('toast.card.updateError')),
  })

  const updateSchedule = useMutation({
    mutationFn: ({
      id,
      startTime,
      endTime,
    }: {
      id: number
      startTime: string | null
      endTime: string | null
    }) => api.updateCardSchedule(id, startTime, endTime),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateBoardDetail(),
        invalidateCardDetail(variables.id),
        invalidatePinned(),
      ])
    },
    onError: () => toast.error(t('toast.card.scheduleError')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCard(id),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success(t('toast.card.deleteSuccess'))
    },
    onError: () => toast.error(t('toast.card.deleteError')),
  })

  const duplicate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DuplicateCardRequest }) =>
      api.duplicateCard(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidatePinned()])
      toast.success(t('toast.card.duplicateSuccess'))
    },
    onError: () => toast.error(t('toast.card.duplicateError')),
  })

  return {
    createCard: create,
    moveCard: move,
    togglePin,
    updateCard: update,
    updateSchedule,
    deleteCard: remove,
    duplicateCard: duplicate,
    togglePinFromPin: togglePin,
  }
}
