import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useSnapshotMutations(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.snapshots.byBoard(boardId) })
  const invalidatePinned = () => qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const create = useMutation({
    mutationFn: (name?: string) => api.createSnapshot(boardId, name),
    onSuccess: async () => {
      await invalidate()
      toast.success(t('toast.snapshot.createSuccess'))
    },
    onError: () => toast.error(t('toast.snapshot.createError')),
  })

  const restore = useMutation({
    mutationFn: (snapshotId: number) => api.restoreSnapshot(boardId, snapshotId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      await invalidate()
      await invalidatePinned()
      toast.success(t('toast.snapshot.restoreSuccess'))
    },
    onError: () => toast.error(t('toast.snapshot.restoreError')),
  })

  const remove = useMutation({
    mutationFn: (snapshotId: number) => api.deleteSnapshot(boardId, snapshotId),
    onSuccess: async () => {
      await invalidate()
      toast.success(t('toast.snapshot.deleteSuccess'))
    },
    onError: () => toast.error(t('toast.snapshot.deleteError')),
  })

  return {
    createSnapshot: create,
    restoreSnapshot: restore,
    deleteSnapshot: remove,
  }
}
