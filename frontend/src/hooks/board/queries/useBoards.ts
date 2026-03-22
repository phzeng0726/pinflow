import { useQuery } from '@tanstack/react-query'
import * as api from '../../../lib/api'
import { queryKeys } from '../../queryKeys'

export function useBoards() {
  return useQuery({ queryKey: queryKeys.boards.all(), queryFn: api.getBoards })
}
