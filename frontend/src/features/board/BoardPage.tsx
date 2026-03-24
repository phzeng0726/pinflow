import { DndContext, DragOverlay } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Moon, Pin, Plus, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { useThemeStore } from '../../stores/themeStore'
import type { Card } from '../../types'
import { AddColumnForm } from './AddColumnForm'
import { ColumnView } from './ColumnView'

export function BoardPage() {
  const navigate = useNavigate()
  const { boardId } = useParams({ from: '/boards/$boardId' })
  const id = Number(boardId)

  const { data: board, isLoading } = useBoardDetail(id)
  const { data: pinned = [] } = usePinnedCards()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const [addingColumn, setAddingColumn] = useState(false)
  const [pinPopoverOpen, setPinPopoverOpen] = useState(false)
  const [pendingUnpinCard, setPendingUnpinCard] = useState<Card | null>(null)

  const pinPopoverRef = useRef<HTMLDivElement>(null)

  const { moveColumn } = useColumnMutations(id)
  const { moveCard, togglePin } = useCardMutations(id)

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
    moveColumnMutate: moveColumn.mutate,
    moveCardMutate: moveCard.mutate,
    onMoveOutAutoPin: (card: Card) => setPendingUnpinCard(card),
  })

  const handleCardUnpin = () => {
    if (!pendingUnpinCard) return
    togglePin.mutate(pendingUnpinCard.id, {
      onSettled: () => setPendingUnpinCard(null),
    })
  }

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
                  boardId={id}
                  column={col}
                  overId={overId}
                  activeCardDndId={activeCardDndId}
                />
              ))}

              <div className="w-64 shrink-0">
                {addingColumn ? (
                  <AddColumnForm
                    board={board}
                    setAddingColumn={setAddingColumn}
                  />
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

          {/* 拖拉當下抓著的那個項目長怎樣 */}
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

      {/* 卡片移出自動釘選欄位時跳提醒框 */}
      <AlertDialog
        open={!!pendingUnpinCard}
        onOpenChange={(open) => {
          if (!open) setPendingUnpinCard(null)
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
              onClick={handleCardUnpin}
              disabled={togglePin.isPending}
            >
              取消釘選
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
