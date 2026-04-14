import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { DependencyType } from '@/types'
import { queryKeys } from '@/hooks/queryKeys'

export function useDependencyMutations(cardId: number, boardId?: number) {
  const qc = useQueryClient()

  const invalidateDependencies = () =>
    qc.invalidateQueries({ queryKey: queryKeys.dependencies.byCard(cardId) })

  const invalidateBoardDetail = () =>
    boardId != null
      ? qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      : Promise.resolve()

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
      await Promise.all([invalidateDependencies(), invalidateBoardDetail()])
      toast.success('Dependency 已建立')
    },
    onError: () => toast.error('建立 Dependency 失敗'),
  })

  const deleteDep = useMutation({
    mutationFn: (dependencyId: number) => api.deleteDependency(dependencyId),
    onSuccess: async () => {
      await Promise.all([invalidateDependencies(), invalidateBoardDetail()])
      toast.success('Dependency 已移除')
    },
    onError: () => toast.error('移除 Dependency 失敗'),
  })

  return { createDep, deleteDep }
}
