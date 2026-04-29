import { useColumnMutations } from '@/hooks/column/mutations/useColumnMutations'
import { type EditColumnForm, editColumnSchema } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, MoreHorizontal, Pencil, Pin, Trash2, X } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Column } from '@/types'

interface ColumnHeaderProps {
  boardId: number
  column: Column
  cardCount: number
  dragHandleProps?: HTMLAttributes<HTMLElement>
}

export function ColumnHeader(props: ColumnHeaderProps) {
  const { boardId, column, cardCount, dragHandleProps } = props
  const { t } = useTranslation()

  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { updateColumn, deleteColumn } = useColumnMutations(boardId)

  const { register, handleSubmit, reset } = useForm<EditColumnForm>({
    resolver: zodResolver(editColumnSchema),
    defaultValues: { name: column.name },
  })

  const handleUpdateColumn = (form: EditColumnForm) => {
    updateColumn.mutate({ id: column.id, form })
    setEditing(false)
  }

  const handleEscapeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      reset()
      setEditing(false)
    }
  }

  const handleCancelEdit = () => {
    reset()
    setEditing(false)
  }

  const handleSelectRename = () => {
    reset({ name: column.name })
    setEditing(true)
  }

  const handleSelectAutoPin = () => handleUpdateColumn({ autoPin: !column.autoPin })

  const handleSelectDelete = (e: Event) => {
    e.preventDefault()
    setDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteColumn.mutate(column.id)
    setDeleteOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2">
        <div
          {...dragHandleProps}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1"
        >
          {editing ? (
            <form
              onSubmit={handleSubmit(handleUpdateColumn)}
              className="flex flex-1 gap-1"
            >
              <Input
                {...register('name')}
                onKeyDown={handleEscapeKeyDown}
                className="h-6 py-0 text-sm"
                autoFocus
              />
              <button type="submit" className="text-green-600">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-gray-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
              {column.name}
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                ({cardCount})
              </span>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {column.autoPin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Pin className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('column.autoPinEnabled')}</TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={handleSelectRename}>
                <Pencil className="h-3.5 w-3.5" />
                {t('column.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSelectAutoPin}>
                <Pin
                  className={cn(
                    'h-3.5 w-3.5',
                    column.autoPin ? 'text-blue-500' : 'text-gray-400',
                  )}
                />
                {column.autoPin ? t('column.disableAutoPin') : t('column.enableAutoPin')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSelectDelete}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('column.deleteColumn')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.deleteColumnTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteColumnDesc', { name: column.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleConfirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
