import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { DependencyType } from '@/types'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useDependencyMutations(cardId: number, boardId?: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  const invalidateDependencies = () =>
    qc.invalidateQueries({ queryKey: queryKeys.dependencies.byCard(cardId) })

  const invalidateBoardDetail = () =>
    boardId != null
      ? qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      : Promise.resolve()
  const invalidatePinned = () =>
    qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() })

  const createDep = useMutation({
    mutationFn: ({
      fromCardId = cardId,
      toCardId,
      type,
    }: {
      fromCardId?: number
      toCardId: number
      type: DependencyType
    }) => api.createDependency(fromCardId, toCardId, type),
    onSuccess: async () => {
      await Promise.all([invalidateDependencies(), invalidateBoardDetail(), invalidatePinned()])
      toast.success(t('toast.dependency.created'))
    },
    onError: () => toast.error(t('toast.dependency.createError')),
  })

  const deleteDep = useMutation({
    mutationFn: (dependencyId: number) => api.deleteDependency(dependencyId),
    onSuccess: async () => {
      await Promise.all([invalidateDependencies(), invalidateBoardDetail(), invalidatePinned()])
      toast.success(t('toast.dependency.deleted'))
    },
    onError: () => toast.error(t('toast.dependency.deleteError')),
  })

  return { createDep, deleteDep }
}
