import { cn } from '@/lib/utils'
import { AddCardForm } from '@/pages/board-detail/components/cards/AddCardForm'
import { CardItem } from '@/pages/board-detail/components/cards/CardItem'
import type { Column } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnHeader } from './ColumnHeader'

interface ColumnViewProps {
  boardId: number
  column: Column
}

export function ColumnView(props: ColumnViewProps) {
  const { boardId, column } = props

  const cards = (column.cards ?? []).sort((a, b) => a.position - b.position)
  const cardIds = cards.map((c) => `card-${c.id}`)
  const colDropId = `col-drop-${column.id}`

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: colDropId })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
    data: { type: 'column', column },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="flex max-h-[calc(100vh-140px)] w-64 shrink-0 flex-col rounded-xl bg-gray-200 dark:bg-gray-800"
      >
        <ColumnHeader
          boardId={boardId}
          column={column}
          cardCount={cards.length}
          dragHandleProps={listeners}
        />

        <div
          ref={setDropRef}
          className={cn(
            'min-h-[60px] flex-1 overflow-y-auto rounded-lg px-2 pb-2 transition-colors',
            isOver && cards.length === 0 && 'bg-blue-50 dark:bg-blue-900/20',
          )}
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 pt-1">
              {cards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  boardId={column.boardId}
                  columnAutoPin={column.autoPin}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <div className="px-2 pb-2">
          <AddCardForm boardId={boardId} columnId={column.id} />
        </div>
      </div>
    </>
  )
}
