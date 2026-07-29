import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/queryKeys'
import { getWorkspaceSource } from '@/lib/api'

export function useWorkspaceSource(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sync.source(),
    queryFn: getWorkspaceSource,
    enabled,
  })
}
