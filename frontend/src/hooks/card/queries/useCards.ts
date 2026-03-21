import { useQuery } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useCard(id: number) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => api.getCard(id),
  })
}

export function usePinnedCards() {
  return useQuery({
    queryKey: queryKeys.cards.pinned(),
    queryFn: api.getPinnedCards,
    refetchInterval: 3000,
  })
}
