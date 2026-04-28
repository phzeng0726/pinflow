import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchCards } from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'

export function useCardSearch(
  query: string,
  limit = 10,
  debounceMs = 300,
  boardId?: number,
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [debouncedLimit, setDebouncedLimit] = useState(limit)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setDebouncedLimit(limit)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, limit, debounceMs])

  return useQuery({
    queryKey: queryKeys.cards.search(debouncedQuery, debouncedLimit, boardId),
    queryFn: () => searchCards(debouncedQuery, debouncedLimit, boardId),
  })
}
