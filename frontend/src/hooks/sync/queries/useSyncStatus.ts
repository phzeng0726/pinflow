import { useQuery } from '@tanstack/react-query'
import { getSyncStatus } from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useSyncStatus(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.sync.status(), queryFn: getSyncStatus, enabled, refetchInterval: enabled ? 5000 : false })
}
