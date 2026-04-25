import { createFileRoute } from '@tanstack/react-router'
import { BoardPage } from '@/pages/board-detail/BoardPage'

export const Route = createFileRoute('/boards/$boardId')({
  validateSearch: (search: Record<string, unknown>) => ({
    view: (
      search.view === 'graph'
        ? 'graph'
        : search.view === 'timeline'
          ? 'timeline'
          : 'board'
    ) as 'board' | 'graph' | 'timeline',
  }),
  component: BoardPage,
})
