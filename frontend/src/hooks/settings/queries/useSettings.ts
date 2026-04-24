import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings.all(), queryFn: api.getSettings })
}
