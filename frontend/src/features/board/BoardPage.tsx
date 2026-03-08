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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Moon, Pin, Plus, Sun } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useBoard } from '../../hooks/useBoards'
import { useCreateCard, useDeleteCard, useMoveCard, usePinnedCards, useTogglePin, useUpdateCard } from '../../hooks/useCards'
import { useCreateColumn, useDeleteColumn, useUpdateColumn } from '../../hooks/useColumns'
import { midPosition } from '../../lib/utils'
import { useThemeStore } from '../../stores/themeStore'
import type { Card, Column } from '../../types'
import { AddCardForm } from './AddCardForm'
import { CardItem } from './CardItem'
import { ColumnHeader } from './ColumnHeader'

export function BoardPage() {
  const { boardId } = useParams({ from: '/boards/$boardId' })
  const id = Number(boardId)
  const navigate = useNavigate()
  const { data: board, isLoading } = useBoard(id)
  const { data: pinned = [] } = usePinnedCards()
  const { theme, toggle: toggleTheme } = useThemeStore()

  const createColumn = useCreateColumn(id)
  const updateColumn = useUpdateColumn(id)
  const deleteColumn = useDeleteColumn(id)
  const createCard = useCreateCard(id)
  const moveCard = useMoveCard(id)
  const togglePin = useTogglePin(id)
  const updateCard = useUpdateCard(id)
  const deleteCard = useDeleteCard(id)

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
  const [newColumnName, setNewColumnName] = useState('')
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeCardDndId, setActiveCardDndId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!board) return <div className="flex items-center justify-center h-screen">看板不存在</div>

  const columns = board.columns ?? []

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (data?.type === 'card') {
      setActiveCard(data.card)
      setActiveCardDndId(`card-${data.card.id}`)
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    setOverId(e.over ? String(e.over.id) : null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null)
    setActiveCardDndId(null)
    setOverId(null)

    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeData = active.data.current
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

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return
    await createColumn.mutateAsync(newColumnName.trim())
    setNewColumnName('')
    setAddingColumn(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{board.name}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">PinFlow</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? '切換亮色模式' : '切換暗色模式'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
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
                    <button
                      className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
                      onClick={() => { (window as any).electronAPI.togglePinWindow(); setPinPopoverOpen(false) }}
                    >
                      浮動視窗
                    </button>
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
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                  <Input
                    value={newColumnName}
                    onChange={e => setNewColumnName(e.target.value)}
                    placeholder="欄位名稱"
                    onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                    autoFocus
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleAddColumn} disabled={!newColumnName.trim()} className="h-7 text-xs">新增</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingColumn(false)} className="h-7 text-xs">取消</Button>
                  </div>
                </div>
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

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 shadow-2xl p-3 w-60 rotate-2 opacity-95 cursor-grabbing">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 select-none">{activeCard.title}</p>
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

  const { setNodeRef, isOver } = useDroppable({ id: colDropId })

  const isDragging = activeCardDndId !== null

  return (
    <div className="w-64 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-xl flex flex-col max-h-[calc(100vh-140px)]">
      <ColumnHeader
        column={column}
        cardCount={cards.length}
        onRename={onRename}
        onToggleAutoPin={onToggleAutoPin}
        onDelete={onDeleteColumn}
      />
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto px-2 pb-2 min-h-[60px] rounded-lg transition-colors ${
          isOver && cards.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pt-1">
            {cards.map(card => {
              const dndId = `card-${card.id}`
              // 顯示插入線：overId 對到這張卡，且不是自己
              const showLineBefore = isDragging && overId === dndId && activeCardDndId !== dndId
              return (
                <Fragment key={card.id}>
                  {showLineBefore && <InsertionLine />}
                  <CardItem
                    card={card}
                    columnAutoPin={column.auto_pin}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteCard}
                    onUpdate={onUpdateCard}
                  />
                </Fragment>
              )
            })}
            {/* 拖到欄位尾端（over column drop zone 且有卡片）顯示末尾插入線 */}
            {isDragging && isOver && cards.length > 0 && overId === colDropId && (
              <InsertionLine />
            )}
          </div>
        </SortableContext>
        {/* 空欄位拖入提示 */}
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
