import { useQuery } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function usePinnedCards() {
  return useQuery({
    queryKey: queryKeys.cards.pinned(),
    queryFn: api.getPinnedCards,
    refetchInterval: 3000,
  })
}
