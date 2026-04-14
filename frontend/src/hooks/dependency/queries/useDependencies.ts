import { useQuery } from '@tanstack/react-query'
import { listDependencies } from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useDependencies(cardId: number) {
  return useQuery({
    queryKey: queryKeys.dependencies.byCard(cardId),
    queryFn: () => listDependencies(cardId),
  })
}
