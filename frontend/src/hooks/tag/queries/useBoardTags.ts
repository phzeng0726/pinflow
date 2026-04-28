import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useBoardTags(boardId: number) {
  return useQuery({
    queryKey: queryKeys.tags.byBoard(boardId),
    queryFn: () => api.listBoardTags(boardId),
    enabled: boardId > 0,
  })
}
