import { useQuery } from '@tanstack/react-query'
import { listBoardDependencies } from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useBoardDependencies(boardId: number) {
  return useQuery({
    queryKey: queryKeys.dependencies.byBoard(boardId),
    queryFn: () => listBoardDependencies(boardId),
  })
}
