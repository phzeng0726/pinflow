import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Fragment } from 'react'
import type { Column } from '@/types'
import { AddCardForm } from '@/pages/board-detail/components/cards/AddCardForm'
import { CardItem } from '@/pages/board-detail/components/cards/CardItem'
import { ColumnHeader } from './ColumnHeader'

interface ColumnViewProps {
  boardId: number
  column: Column
  overId: string | null
  activeCardDndId: string | null
}

export function ColumnView(props: ColumnViewProps) {
  const { boardId, column, overId, activeCardDndId } = props

  const cards = (column.cards ?? []).sort((a, b) => a.position - b.position)
  const cardIds = cards.map((c) => `card-${c.id}`)
  const colDropId = `column-drop-${column.id}`

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: colDropId })

  const {
    attributes: colAttributes,
    listeners: colListeners,
    setNodeRef: setSortRef,
    transform: colTransform,
    isDragging: isColDragging,
  } = useSortable({ id: `col-${column.id}`, data: { type: 'column', column } })

  const colStyle = {
    transform: CSS.Translate.toString(colTransform),
    transition: undefined as string | undefined,
    opacity: isColDragging ? 0.4 : 1,
  }

  const isDragging = activeCardDndId !== null

  return (
    <>
      <div
        ref={setSortRef}
        style={colStyle}
        {...colAttributes}
        className="flex max-h-[calc(100vh-140px)] w-64 shrink-0 flex-col rounded-xl bg-gray-200 dark:bg-gray-800"
      >
        <ColumnHeader
          boardId={boardId}
          column={column}
          cardCount={cards.length}
          dragHandleProps={colListeners}
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
              {cards.map((card) => {
                const dndId = `card-${card.id}`
                const showLineBefore =
                  isDragging && overId === dndId && activeCardDndId !== dndId
                return (
                  <Fragment key={card.id}>
                    {showLineBefore && <InsertionLine />}
                    <CardItem
                      card={card}
                      boardId={column.boardId}
                      columnAutoPin={column.autoPin}
                    />
                  </Fragment>
                )
              })}
              {isDragging &&
                isOver &&
                cards.length > 0 &&
                overId === colDropId && <InsertionLine />}
            </div>
          </SortableContext>

          {isDragging && isOver && cards.length === 0 && <InsertionLine />}
        </div>

        <div className="px-2 pb-2">
          <AddCardForm boardId={boardId} columnId={column.id} />
        </div>
      </div>
    </>
  )
}

function InsertionLine() {
  return (
    <div className="pointer-events-none -my-0.5 flex items-center gap-1 px-1">
      <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      <div className="h-0.5 flex-1 rounded-full bg-blue-500" />
    </div>
  )
}
