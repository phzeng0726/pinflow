import { createFileRoute } from '@tanstack/react-router'
import { BoardPage } from '../features/board/BoardPage'

export const Route = createFileRoute('/boards/$boardId')({
  component: BoardPage,
})
