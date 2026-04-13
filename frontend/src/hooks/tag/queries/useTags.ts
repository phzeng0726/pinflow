import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags.all(), queryFn: api.listTags })
}
