import { cn } from '@/lib/utils'
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Moon, Pin, Plus, Sun } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { useBoardDetail } from '../../hooks/board/queries/useBoardDetail'
import { useBoardDnd } from '../../hooks/board/useBoardDnd'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { usePinnedCards } from '../../hooks/card/queries/usePinnedCards'
import { useColumnMutations } from '../../hooks/column/mutations/useColumnMutations'
import { columnSchema } from '../../lib/schemas'
import { useThemeStore } from '../../stores/themeStore'
import type { Card, Column } from '../../types'
import { AddCardForm } from './AddCardForm'
import { CardItem } from './CardItem'
import { ColumnHeader } from './ColumnHeader'

type ColumnForm = z.infer<typeof columnSchema>

export function BoardPage() {
  const { boardId } = useParams({ from: '/boards/$boardId' })
  const id = Number(boardId)
  const navigate = useNavigate()
  const { data: board, isLoading } = useBoardDetail(id)
  const { data: pinned = [] } = usePinnedCards()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const { createColumn, updateColumn, deleteColumn } = useColumnMutations(id)
  const { createCard, moveCard, togglePin, updateCard, deleteCard } =
    useCardMutations(id)

  const [pendingUnpinCard, setPendingUnpinCard] = useState<Card | null>(null)

  const handleMoveOutAutoPin = (card: Card) => setPendingUnpinCard(card)
  const handleConfirmUnpin = () => {
    if (!pendingUnpinCard) return
    togglePin.mutate(pendingUnpinCard.id, {
      onSettled: () => setPendingUnpinCard(null),
    })
  }
  const handleDismissUnpin = () => setPendingUnpinCard(null)

  const [pinPopoverOpen, setPinPopoverOpen] = useState(false)
  const pinPopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pinPopoverOpen) return
    const handler = (e: MouseEvent) => {
      if (
        pinPopoverRef.current &&
        !pinPopoverRef.current.contains(e.target as Node)
      ) {
        setPinPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pinPopoverOpen])

  const [addingColumn, setAddingColumn] = useState(false)

  const {
    register: registerCol,
    handleSubmit: handleSubmitCol,
    reset: resetCol,
  } = useForm<ColumnForm>({
    resolver: zodResolver(columnSchema),
  })

  const columns = [...(board?.columns ?? [])].sort(
    (a, b) => a.position - b.position,
  )

  const {
    sensors,
    activeCard,
    activeCardDndId,
    activeColumn,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardDnd({
    boardId: id,
    columns,
    updateColumnMutate: updateColumn.mutate,
    moveCardMutate: moveCard.mutate,
    onMoveOutAutoPin: handleMoveOutAutoPin,
  })

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  if (!board)
    return (
      <div className="flex h-screen items-center justify-center">
        看板不存在
      </div>
    )

  const handleAddColumn = async (data: ColumnForm) => {
    await createColumn.mutateAsync(data.name)
    resetCol()
    setAddingColumn(false)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/' })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>返回</TooltipContent>
        </Tooltip>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">
            {board.name}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">PinFlow</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? '切換亮色模式' : '切換暗色模式'}
            </TooltipContent>
          </Tooltip>
          <div className="relative" ref={pinPopoverRef}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setPinPopoverOpen((v) => !v)}
            >
              <Pin className="h-3.5 w-3.5" />
              釘選任務
              {pinned.length > 0 && (
                <span className="min-w-[18px] rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-xs text-white">
                  {pinned.length}
                </span>
              )}
            </Button>

            {pinPopoverOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {pinned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
                    <Pin className="mb-1 h-5 w-5 opacity-30" />
                    <p className="text-xs">尚無釘選任務</p>
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {pinned.map((card) => (
                      <li
                        key={card.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Pin className="h-3 w-3 shrink-0 text-blue-500" />
                        <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-200">
                          {card.title}
                        </span>
                        {card.column_name && (
                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-600 dark:text-gray-300">
                            {card.column_name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {(window as any).electronAPI?.isElectron && (
                  <div className="border-t px-3 py-2 dark:border-gray-700">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto w-full justify-start p-0 text-xs text-blue-600 dark:text-blue-400"
                      onClick={() => {
                        ;(window as any).electronAPI.togglePinWindow()
                        setPinPopoverOpen(false)
                      }}
                    >
                      浮動視窗
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!pendingUnpinCard}
        onOpenChange={(open) => {
          if (!open) handleDismissUnpin()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移出自動釘選欄位</AlertDialogTitle>
            <AlertDialogDescription>
              此卡片仍處於釘選狀態，是否同時取消釘選？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>保持釘選</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnpin}
              disabled={togglePin.isPending}
            >
              取消釘選
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => `col-${c.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full items-start gap-3">
              {columns.map((col) => (
                <ColumnView
                  key={col.id}
                  column={col}
                  overId={overId}
                  activeCardDndId={activeCardDndId}
                  onRename={(colId, name) =>
                    updateColumn.mutate({ id: colId, data: { name } })
                  }
                  onToggleAutoPin={(colId, current) =>
                    updateColumn.mutate({
                      id: colId,
                      data: { auto_pin: !current },
                    })
                  }
                  onDeleteColumn={(colId) => deleteColumn.mutate(colId)}
                  onAddCard={(colId, title, description) =>
                    createCard.mutate({ columnId: colId, title, description })
                  }
                  onTogglePin={(cardId) => togglePin.mutate(cardId)}
                  onDeleteCard={(cardId) => deleteCard.mutate(cardId)}
                  onUpdateCard={(cardId, title, description, storyPoint) =>
                    updateCard.mutate({
                      id: cardId,
                      title,
                      description,
                      storyPoint,
                    })
                  }
                />
              ))}

              {/* Add column */}
              <div className="w-64 shrink-0">
                {addingColumn ? (
                  <form
                    onSubmit={handleSubmitCol(handleAddColumn)}
                    className="space-y-2 rounded-xl bg-gray-200 p-3 dark:bg-gray-700"
                  >
                    <Input
                      placeholder="欄位名稱"
                      {...registerCol('name')}
                      autoFocus
                      className="text-sm"
                    />
                    <div className="flex gap-1">
                      <Button type="submit" size="sm" className="h-7 text-xs">
                        新增
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          resetCol()
                          setAddingColumn(false)
                        }}
                        className="h-7 text-xs"
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-gray-500 dark:hover:text-gray-400"
                  >
                    <Plus className="h-4 w-4" />
                    新增欄位
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="w-60 rotate-2 cursor-grabbing rounded-lg border bg-white p-3 opacity-95 shadow-2xl dark:border-gray-600 dark:bg-gray-700">
                <p className="select-none text-sm font-medium text-gray-900 dark:text-gray-100">
                  {activeCard.title}
                </p>
              </div>
            )}
            {activeColumn && (
              <div className="w-64 rotate-1 cursor-grabbing rounded-xl bg-gray-200 p-3 opacity-90 shadow-2xl dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {activeColumn.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {activeColumn.cards?.length ?? 0} 張卡片
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

// ─── Insertion Line ───────────────────────────────────────────────────────────

function InsertionLine() {
  return (
    <div className="pointer-events-none -my-0.5 flex items-center gap-1 px-1">
      <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      <div className="h-0.5 flex-1 rounded-full bg-blue-500" />
    </div>
  )
}

// ─── ColumnView ───────────────────────────────────────────────────────────────

interface ColumnViewProps {
  column: Column
  overId: string | null
  activeCardDndId: string | null
  onRename: (id: number, name: string) => void
  onToggleAutoPin: (id: number, current: boolean) => void
  onDeleteColumn: (id: number) => void
  onAddCard: (columnId: number, title: string, description: string) => void
  onTogglePin: (id: number) => void
  onDeleteCard: (id: number) => void
  onUpdateCard: (
    id: number,
    title: string,
    description: string,
    storyPoint?: number | null,
  ) => void
}

function ColumnView(props: ColumnViewProps) {
  const {
    column,
    overId,
    activeCardDndId,
    onRename,
    onToggleAutoPin,
    onDeleteColumn,
    onAddCard,
    onTogglePin,
    onDeleteCard,
    onUpdateCard,
  } = props

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
    <div
      ref={setSortRef}
      style={colStyle}
      {...colAttributes}
      className="flex max-h-[calc(100vh-140px)] w-64 shrink-0 flex-col rounded-xl bg-gray-200 dark:bg-gray-800"
    >
      <ColumnHeader
        column={column}
        cardCount={cards.length}
        onRename={onRename}
        onToggleAutoPin={onToggleAutoPin}
        onDelete={onDeleteColumn}
        dragHandleProps={colListeners}
      />
      <div
        ref={setDropRef}
        className={cn(
          'min-h-[60px] flex-1 overflow-y-auto rounded-lg px-2 pb-2 transition-colors',
          isOver && cards.length === 0 && 'bg-blue-50 dark:bg-blue-900/20',
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
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
                    boardId={column.board_id}
                    columnAutoPin={column.auto_pin}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteCard}
                    onUpdate={onUpdateCard}
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
        <AddCardForm
          onAdd={(title, desc) => onAddCard(column.id, title, desc)}
        />
      </div>
    </div>
  )
}
