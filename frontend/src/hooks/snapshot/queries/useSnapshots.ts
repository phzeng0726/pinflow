import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useSnapshots(boardId: number) {
  return useQuery({
    queryKey: queryKeys.snapshots.byBoard(boardId),
    queryFn: () => api.listSnapshots(boardId),
  })
}
