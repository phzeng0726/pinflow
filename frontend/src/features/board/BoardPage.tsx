import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Moon, Pin, Plus, Sun } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { useBoard } from '../../hooks/board/queries/useBoards'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { usePinnedCards } from '../../hooks/card/queries/useCards'
import { useColumnMutations } from '../../hooks/column/mutations/useColumnMutations'
import { columnSchema } from '../../lib/schemas'
import { midPosition } from '../../lib/utils'
import { useThemeStore } from '../../stores/themeStore'
import type { Board, Card, Column } from '../../types'
import { PinWindow } from '../pin/PinWindow'
import { AddCardForm } from './AddCardForm'
import { CardItem } from './CardItem'
import { ColumnHeader } from './ColumnHeader'

type ColumnForm = z.infer<typeof columnSchema>

export function BoardPage() {
  const { boardId } = useParams({ from: '/boards/$boardId' })
  const id = Number(boardId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: board, isLoading } = useBoard(id)
  const { data: pinned = [] } = usePinnedCards()
  const { theme, toggle: toggleTheme } = useThemeStore()

  const { createColumn, updateColumn, deleteColumn } = useColumnMutations(id)
  const { createCard, moveCard, togglePin, updateCard, deleteCard } = useCardMutations(id)

  const [pinPopoverOpen, setPinPopoverOpen] = useState(false)
  const pinPopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pinPopoverOpen) return
    const handler = (e: MouseEvent) => {
      if (pinPopoverRef.current && !pinPopoverRef.current.contains(e.target as Node)) {
        setPinPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pinPopoverOpen])

  const [addingColumn, setAddingColumn] = useState(false)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const { register: registerCol, handleSubmit: handleSubmitCol, reset: resetCol } = useForm<ColumnForm>({
    resolver: zodResolver(columnSchema),
  })
  const [activeCardDndId, setActiveCardDndId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!board) return <div className="flex items-center justify-center h-screen">看板不存在</div>

  const columns = [...(board.columns ?? [])].sort((a, b) => a.position - b.position)

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === 'card') {
      setActiveCard(data.card)
      setActiveCardDndId(`card-${data.card.id}`)
    } else if (data?.type === 'column') {
      setActiveColumn(data.column)
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    setOverId(e.over ? String(e.over.id) : null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null)
    setActiveCardDndId(null)
    setActiveColumn(null)
    setOverId(null)

    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeData = active.data.current

    // Column reorder
    if (activeData?.type === 'column') {
      const draggedCol: Column = activeData.column
      const overIdStr = String(over.id)
      if (!overIdStr.startsWith('col-')) return
      const overColId = Number(overIdStr.replace('col-', ''))
      if (draggedCol.id === overColId) return
      const sorted = [...columns].sort((a, b) => a.position - b.position)
      const activeIdx = sorted.findIndex(c => c.id === draggedCol.id)
      const overIdx = sorted.findIndex(c => c.id === overColId)

      const isMovingRight = activeIdx < overIdx

      const targetIdx = isMovingRight ? overIdx + 1 : overIdx

      const before = sorted[targetIdx - 1]?.position ?? null
      const after = sorted[targetIdx]?.position ?? null

      const position = midPosition(before, after)

      // Synchronously update cache BEFORE calling mutate
      // This prevents flicker: when dnd-kit resets transforms, React
      // re-renders with the already-correct column order from cache
      const boardKey = ['boards', id] as const
      const prev = qc.getQueryData<Board>(boardKey)
      if (prev?.columns) {
        qc.setQueryData<Board>(boardKey, {
          ...prev,
          columns: prev.columns.map(col =>
            col.id === draggedCol.id ? { ...col, position } : col,
          ),
        })
      }

      updateColumn.mutate({ id: draggedCol.id, data: { position } })
      return
    }

    if (activeData?.type !== 'card') return

    const dragged: Card = activeData.card
    const overIdStr = String(over.id)

    let targetColumnId: number
    let targetCards: Card[]

    if (overIdStr.startsWith('card-')) {
      const overCardId = Number(overIdStr.replace('card-', ''))
      const overCol = columns.find(c => c.cards?.some(card => card.id === overCardId))
      if (!overCol) return
      targetColumnId = overCol.id
      targetCards = overCol.cards ?? []
    } else if (overIdStr.startsWith('column-drop-')) {
      targetColumnId = Number(overIdStr.replace('column-drop-', ''))
      const col = columns.find(c => c.id === targetColumnId)
      targetCards = col?.cards ?? []
    } else {
      return
    }

    const overCardId = overIdStr.startsWith('card-') ? Number(overIdStr.replace('card-', '')) : null
    const sorted = [...targetCards].sort((a, b) => a.position - b.position)
    const overIdx = overCardId ? sorted.findIndex(c => c.id === overCardId) : sorted.length
    const before = sorted[overIdx - 1]?.position ?? null
    const after = sorted[overIdx]?.position ?? null
    const position = midPosition(before, after)

    moveCard.mutate({ id: dragged.id, columnId: targetColumnId, position })
  }

  const handleAddColumn = async (data: ColumnForm) => {
    await createColumn.mutateAsync(data.name)
    resetCol()
    setAddingColumn(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="fixed bottom-4 right-4 w-72 max-h-[70vh] shadow-2xl rounded-xl overflow-hidden border z-50">
        <PinWindow />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/' })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>返回</TooltipContent>
        </Tooltip>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{board.name}</h1>
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
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? '切換亮色模式' : '切換暗色模式'}</TooltipContent>
          </Tooltip>
          <div className="relative" ref={pinPopoverRef}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setPinPopoverOpen(v => !v)}
            >
              <Pin className="w-3.5 h-3.5" />
              釘選任務
              {pinned.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {pinned.length}
                </span>
              )}
            </Button>

            {pinPopoverOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                {pinned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
                    <Pin className="w-5 h-5 mb-1 opacity-30" />
                    <p className="text-xs">尚無釘選任務</p>
                  </div>
                ) : (
                  <ul className="py-1 max-h-64 overflow-y-auto">
                    {pinned.map(card => (
                      <li key={card.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Pin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{card.title}</span>
                        {card.column_name && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded shrink-0">
                            {card.column_name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {(window as any).electronAPI?.isElectron && (
                  <div className="border-t dark:border-gray-700 px-3 py-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="w-full text-xs text-blue-600 dark:text-blue-400 h-auto p-0 justify-start"
                      onClick={() => { (window as any).electronAPI.togglePinWindow(); setPinPopoverOpen(false) }}
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

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columns.map(c => `col-${c.id}`)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 h-full items-start">
              {columns.map(col => (
                <ColumnView
                  key={col.id}
                  column={col}
                  overId={overId}
                  activeCardDndId={activeCardDndId}
                  onRename={(colId, name) => updateColumn.mutate({ id: colId, data: { name } })}
                  onToggleAutoPin={(colId, current) => updateColumn.mutate({ id: colId, data: { auto_pin: !current } })}
                  onDeleteColumn={(colId) => deleteColumn.mutate(colId)}
                  onAddCard={(colId, title, description) => createCard.mutate({ columnId: colId, title, description })}
                  onTogglePin={(cardId) => togglePin.mutate(cardId)}
                  onDeleteCard={(cardId) => deleteCard.mutate(cardId)}
                  onUpdateCard={(cardId, title, description) => updateCard.mutate({ id: cardId, title, description })}
                />
              ))}

              {/* Add column */}
              <div className="w-64 shrink-0">
                {addingColumn ? (
                  <form onSubmit={handleSubmitCol(handleAddColumn)} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                    <Input
                      placeholder="欄位名稱"
                      {...registerCol('name')}
                      autoFocus
                      className="text-sm"
                    />
                    <div className="flex gap-1">
                      <Button type="submit" size="sm" className="h-7 text-xs">新增</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { resetCol(); setAddingColumn(false) }} className="h-7 text-xs">取消</Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-500 dark:hover:text-gray-400 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增欄位
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 shadow-2xl p-3 w-60 rotate-2 opacity-95 cursor-grabbing">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 select-none">{activeCard.title}</p>
              </div>
            )}
            {activeColumn && (
              <div className="w-64 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl opacity-90 rotate-1 cursor-grabbing p-3">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{activeColumn.name}</p>
                <p className="text-xs text-gray-400 mt-1">{activeColumn.cards?.length ?? 0} 張卡片</p>
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
    <div className="flex items-center gap-1 px-1 -my-0.5 pointer-events-none">
      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
      <div className="flex-1 h-0.5 bg-blue-500 rounded-full" />
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
  onUpdateCard: (id: number, title: string, description: string) => void
}

function ColumnView({
  column, overId, activeCardDndId,
  onRename, onToggleAutoPin, onDeleteColumn,
  onAddCard, onTogglePin, onDeleteCard, onUpdateCard,
}: ColumnViewProps) {
  const cards = (column.cards ?? []).sort((a, b) => a.position - b.position)
  const cardIds = cards.map(c => `card-${c.id}`)
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
      className="w-64 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-xl flex flex-col max-h-[calc(100vh-140px)]"
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
        className={`flex-1 overflow-y-auto px-2 pb-2 min-h-[60px] rounded-lg transition-colors ${isOver && cards.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pt-1">
            {cards.map(card => {
              const dndId = `card-${card.id}`
              const showLineBefore = isDragging && overId === dndId && activeCardDndId !== dndId
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
            {isDragging && isOver && cards.length > 0 && overId === colDropId && (
              <InsertionLine />
            )}
          </div>
        </SortableContext>
        {isDragging && isOver && cards.length === 0 && (
          <InsertionLine />
        )}
      </div>
      <div className="px-2 pb-2">
        <AddCardForm onAdd={(title, desc) => onAddCard(column.id, title, desc)} />
      </div>
    </div>
  )
}
