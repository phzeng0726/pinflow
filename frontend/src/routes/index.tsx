import { createFileRoute } from '@tanstack/react-router'
import { BoardListPage } from '@/pages/board-list/BoardListPage'

export const Route = createFileRoute('/')({
  component: BoardListPage,
})
