import { zodResolver } from '@hookform/resolvers/zod'
import { Check, MoreHorizontal, Pencil, Pin, Trash2, X } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { columnSchema } from '../../lib/schemas'
import { cn } from '../../lib/utils'
import type { Column } from '../../types'

type ColumnForm = z.infer<typeof columnSchema>

interface ColumnHeaderProps {
  column: Column
  cardCount: number
  onRename: (id: number, name: string) => void
  onToggleAutoPin: (id: number, current: boolean) => void
  onDelete: (id: number) => void
  dragHandleProps?: HTMLAttributes<HTMLElement>
}

const COLUMN_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
]

export function ColumnHeader(props: ColumnHeaderProps) {
  const {
    column,
    cardCount,
    onRename,
    onToggleAutoPin,
    onDelete,
    dragHandleProps,
  } = props

  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset } = useForm<ColumnForm>({
    resolver: zodResolver(columnSchema),
    defaultValues: { name: column.name },
  })

  const colorClass = COLUMN_COLORS[column.id % COLUMN_COLORS.length]

  const handleRename = (data: ColumnForm) => {
    onRename(column.id, data.name)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div
        {...dragHandleProps}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1"
      >
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colorClass)} />
        {editing ? (
          <form
            onSubmit={handleSubmit(handleRename)}
            className="flex flex-1 gap-1"
          >
            <Input
              {...register('name')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  reset()
                  setEditing(false)
                }
              }}
              className="h-6 py-0 text-sm"
              autoFocus
            />
            <button type="submit" className="text-green-600">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setEditing(false)
              }}
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
        {column.auto_pin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Pin className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
              </span>
            </TooltipTrigger>
            <TooltipContent>自動釘選已開啟</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                reset({ name: column.name })
                setEditing(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              重新命名
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onToggleAutoPin(column.id, column.auto_pin)}
            >
              <Pin
                className={cn(
                  'h-3.5 w-3.5',
                  column.auto_pin ? 'text-blue-500' : 'text-gray-400',
                )}
              />
              {column.auto_pin ? '關閉自動釘選' : '開啟自動釘選'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(column.id)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              刪除欄位
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
