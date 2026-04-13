import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useBoardDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.boards.detail(id),
    queryFn: () => api.getBoard(id),
    enabled: id > 0,
  })
}
