import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useArchivedCards(boardId: number) {
  return useQuery({
    queryKey: queryKeys.archive.cards(boardId),
    queryFn: () => api.getArchivedCards(boardId),
  })
}

export function useArchivedColumns(boardId: number) {
  return useQuery({
    queryKey: queryKeys.archive.columns(boardId),
    queryFn: () => api.getArchivedColumns(boardId),
  })
}
