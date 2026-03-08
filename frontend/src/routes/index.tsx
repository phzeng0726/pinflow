import { createFileRoute } from '@tanstack/react-router'
import { BoardListPage } from '../features/board/BoardListPage'

export const Route = createFileRoute('/')({
  component: BoardListPage,
})
