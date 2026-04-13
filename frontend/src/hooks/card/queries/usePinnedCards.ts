import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function usePinnedCards() {
  return useQuery({
    queryKey: queryKeys.cards.pinned(),
    queryFn: api.getPinnedCards,
  })
}
