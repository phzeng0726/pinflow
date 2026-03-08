import { useState } from 'react'
import { Pin, Trash2, MoreHorizontal, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Column } from '../../types'
import { Input } from '../../components/ui/input'

interface ColumnHeaderProps {
  column: Column
  cardCount: number
  onRename: (id: number, name: string) => void
  onToggleAutoPin: (id: number, current: boolean) => void
  onDelete: (id: number) => void
}

const COLUMN_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500',
  'bg-green-500', 'bg-blue-500', 'bg-purple-500',
]

export function ColumnHeader({ column, cardCount, onRename, onToggleAutoPin, onDelete }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [menuOpen, setMenuOpen] = useState(false)

  const colorClass = COLUMN_COLORS[column.id % COLUMN_COLORS.length]

  const handleRename = () => {
    if (!name.trim()) return
    onRename(column.id, name.trim())
    setEditing(false)
    setMenuOpen(false)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 relative">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', colorClass)} />
        {editing ? (
          <div className="flex gap-1 flex-1">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }}
              className="h-6 text-sm py-0"
              autoFocus
            />
            <button onClick={handleRename} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">
            {column.name}
            <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">({cardCount})</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {column.auto_pin && (
          <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500" aria-label="自動釘選已開啟" />
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg py-1 w-44 z-20 text-sm">
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                onClick={() => { setEditing(true); setMenuOpen(false) }}
              >
                重新命名
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                onClick={() => { onToggleAutoPin(column.id, column.auto_pin); setMenuOpen(false) }}
              >
                <Pin className={cn('w-3.5 h-3.5', column.auto_pin ? 'text-blue-500' : 'text-gray-400')} />
                {column.auto_pin ? '關閉自動釘選' : '開啟自動釘選'}
              </button>
              <hr className="my-1 dark:border-gray-600" />
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2"
                onClick={() => { onDelete(column.id); setMenuOpen(false) }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                刪除欄位
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
