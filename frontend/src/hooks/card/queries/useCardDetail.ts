import { useQuery } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useCardDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => api.getCard(id),
  })
}
