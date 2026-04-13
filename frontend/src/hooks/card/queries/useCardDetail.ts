import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useCardDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => api.getCard(id),
  })
}
