import type { EditColumnForm, NewColumnForm } from '@/lib/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useColumnMutations(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateBoardDetail = () =>
    qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
  const invalidateSnapshots = () =>
    qc.invalidateQueries({ queryKey: queryKeys.snapshots.byBoard(boardId) })

  const create = useMutation({
    mutationFn: (form: NewColumnForm) => api.createColumn(boardId, form),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidateSnapshots()])
      toast.success(t('toast.column.createSuccess'))
    },
    onError: () => toast.error(t('toast.column.createError')),
  })

  const update = useMutation({
    mutationFn: (props: { id: number; form: EditColumnForm }) => {
      const { id, form } = props
      return api.updateColumn(id, form)
    },
    onSuccess: async () => {
      await invalidateBoardDetail()
      toast.success(t('toast.column.updateSuccess'))
    },
    onError: () => toast.error(t('toast.column.updateError')),
  })

  const move = useMutation({
    mutationFn: (props: { id: number; position: number }) => {
      const { id, position } = props
      return api.moveColumn(id, position)
    },
    onSuccess: async () => {
      await invalidateBoardDetail()
    },
    onError: () => toast.error(t('toast.column.moveError')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteColumn(id),
    onSuccess: async () => {
      await Promise.all([invalidateBoardDetail(), invalidateSnapshots()])
      toast.success(t('toast.column.deleteSuccess'))
    },
    onError: () => toast.error(t('toast.column.deleteError')),
  })

  return {
    createColumn: create,
    updateColumn: update,
    moveColumn: move,
    deleteColumn: remove,
  }
}
