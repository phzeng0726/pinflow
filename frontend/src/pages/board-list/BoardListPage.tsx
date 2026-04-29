import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { LocaleToggle } from '@/components/common/LocaleToggle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBoardMutations } from '@/hooks/board/mutations/useBoardMutations'
import { useBoards } from '@/hooks/board/queries/useBoards'
import { useBoardListDnd } from '@/hooks/dnd/useBoardListDnd'
import { DND_TYPE } from '@/hooks/dnd/dndUtils'
import { type NewOrEditBoardForm, createBoardSchema } from '@/lib/schemas'
import { useThemeStore } from '@/stores/themeStore'
import type { Board } from '@/types'
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { GripVertical, LayoutDashboard, Moon, Plus, Sun, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface SortableBoardCardProps {
  board: Board
  onNavigate: () => void
  onRequestDelete: (e: React.MouseEvent) => void
}

function SortableBoardCard({ board, onNavigate, onRequestDelete }: SortableBoardCardProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: board.id,
    data: { type: DND_TYPE.BOARD, board },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group cursor-pointer rounded-lg border bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between p-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {board.name}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('board.columns', { count: board.columns?.length ?? 0 })}
          </p>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-grab text-gray-300 opacity-0 transition-all hover:text-gray-500 group-hover:opacity-100 dark:hover:text-gray-300 active:cursor-grabbing"
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
            onClick={onRequestDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BoardListPage() {
  const { data: boards = [], isLoading } = useBoards()
  const { createBoard, deleteBoard, moveBoard } = useBoardMutations()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [creating, setCreating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: number
    name: string
  } | null>(null)
  const { t } = useTranslation()
  const boardSchema = useMemo(() => createBoardSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewOrEditBoardForm>({
    resolver: zodResolver(boardSchema),
  })

  const { sensors, activeBoard, displayBoards, handleDragStart, handleDragEnd, handleDragCancel } =
    useBoardListDnd({
      boards,
      moveBoardMutate: (args) => moveBoard.mutate(args),
    })

  const onSubmit = (form: NewOrEditBoardForm) => {
    createBoard.mutate(form, {
      onSuccess: () => {
        reset()
        setCreating(false)
      },
    })
  }

  const handleStartCreating = () => setCreating(true)

  const handleCancelCreating = () => {
    reset()
    setCreating(false)
  }

  const handleDeleteDialogOpenChange = (o: boolean) => {
    if (!o) {
      setShowDeleteConfirm(null)
    }
  }

  const handleConfirmDeleteBoard = () => {
    if (showDeleteConfirm) {
      deleteBoard.mutate(showDeleteConfirm.id)
      setShowDeleteConfirm(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner variant="inline" className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <LayoutDashboard className="h-6 w-6" />
            {t('board.myBoards')}
          </h1>
          <div className="flex items-center gap-2">
            <LocaleToggle />
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
                {theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
              </TooltipContent>
            </Tooltip>
            <Button
              onClick={handleStartCreating}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('board.newBoard')}
            </Button>
          </div>
        </div>

        {creating && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mb-4 space-y-1 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex gap-2">
              <Input
                placeholder={t('board.namePlaceholder')}
                {...register('name')}
                autoFocus
                className="flex-1"
              />
              <Button type="submit">{t('board.create')}</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelCreating}
              >
                {t('common.cancel')}
              </Button>
            </div>
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </form>
        )}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={displayBoards.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayBoards.map((board) => {
                const handleNavigateToBoard = () =>
                  navigate({
                    to: '/boards/$boardId',
                    params: { boardId: String(board.id) },
                    search: { view: 'board' },
                  })
                const handleRequestDeleteBoard = (e: React.MouseEvent) => {
                  e.stopPropagation()
                  setShowDeleteConfirm({ id: board.id, name: board.name })
                }
                return (
                  <SortableBoardCard
                    key={board.id}
                    board={board}
                    onNavigate={handleNavigateToBoard}
                    onRequestDelete={handleRequestDeleteBoard}
                  />
                )
              })}

              {displayBoards.length === 0 && !creating && (
                <div className="col-span-3 py-12 text-center text-gray-400 dark:text-gray-600">
                  <LayoutDashboard className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p>{t('board.noBoards')}</p>
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeBoard ? (
              <div className="cursor-grabbing rounded-lg border bg-white p-4 opacity-90 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {activeBoard.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('board.columns', { count: activeBoard.columns?.length ?? 0 })}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <p className="absolute bottom-4 right-6 select-none text-xs text-gray-300 dark:text-gray-600">
        v{__APP_VERSION__}
      </p>

      <AlertDialog
        open={showDeleteConfirm !== null}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.deleteBoardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteBoardDesc', {
                name: showDeleteConfirm?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleConfirmDeleteBoard}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
