import { createFileRoute } from '@tanstack/react-router'
import { CardDetailPage } from '@/pages/card-detail/CardDetailPage'

export const Route = createFileRoute('/card-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    boardId: Number(search.boardId),
    cardId: Number(search.cardId),
  }),
  component: CardDetailPage,
})
