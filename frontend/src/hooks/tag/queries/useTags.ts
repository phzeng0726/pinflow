import { useQuery } from '@tanstack/react-query'
import { listTags } from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags.all(), queryFn: listTags })
}