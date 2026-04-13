import { createFileRoute } from '@tanstack/react-router'
import { BoardPage } from '@/pages/board-detail/BoardPage'

export const Route = createFileRoute('/boards/$boardId')({
  component: BoardPage,
})
