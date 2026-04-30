import type { NewOrEditBoardForm } from '@/lib/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useBoardMutations() {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateBoardAll = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  const invalidateBoardDetail = (id: number) =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(id) })
  const invalidatePinned = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const create = useMutation({
    mutationFn: (form: NewOrEditBoardForm) => api.createBoard(form),
    onSuccess: async () => {
      await invalidateBoardAll()
      toast.success(t('toast.board.createSuccess'))
    },
    onError: () => toast.error(t('toast.board.createError')),
  })

  const update = useMutation({
    mutationFn: (props: { id: number; form: NewOrEditBoardForm }) => {
      const { id, form } = props
      return api.updateBoard(id, form)
    },
    onSuccess: async (data) => {
      await Promise.all([invalidateBoardAll(), invalidateBoardDetail(data.id)])
      toast.success(t('toast.board.updateSuccess'))
    },
    onError: () => toast.error(t('toast.board.updateError')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteBoard(id),
    onSuccess: async () => {
      await Promise.all([invalidateBoardAll(), invalidatePinned()])
      toast.success(t('toast.board.deleteSuccess'))
    },
    onError: () => toast.error(t('toast.board.deleteError')),
  })

  const move = useMutation({
    mutationFn: (props: { id: number; position: number }) =>
      api.moveBoard(props.id, props.position),
    onSuccess: async () => {
      await invalidateBoardAll()
    },
    onError: () => toast.error(t('toast.board.updateError')),
  })

  return {
    createBoard: create,
    updateBoard: update,
    moveBoard: move,
    deleteBoard: remove,
  }
}
