import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pin, PinOff, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Card } from '../../types'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'

interface CardItemProps {
  card: Card
  columnAutoPin: boolean
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, title: string, description: string) => void
}

export function CardItem({ card, columnAutoPin, onTogglePin, onDelete, onUpdate }: CardItemProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDesc, setEditDesc] = useState(card.description)

  // Whole card is draggable — attributes & listeners go on the outer div
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleSave = () => {
    if (!editTitle.trim()) return
    onUpdate(card.id, editTitle.trim(), editDesc)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setEditDesc(card.description)
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-3 shadow-sm"
      >
        <Input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          className="mb-2 font-medium"
          autoFocus
        />
        <Textarea
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          placeholder="描述（選填）"
          className="mb-2 text-sm"
          rows={2}
        />
        <div className="flex gap-1">
          <Button size="icon" onClick={handleSave} className="h-7 w-7"><Check className="w-3 h-3" /></Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7"><X className="w-3 h-3" /></Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // 整張卡片可拖曳，加 select-none 避免反白文字
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-3 shadow-sm',
        'group relative select-none',
        'cursor-grab active:cursor-grabbing',
        card.is_pinned && 'border-l-4 border-l-blue-500'
      )}
    >
      <div className="flex items-start gap-2">
        {/* 視覺提示，不再掛 listeners */}
        <GripVertical className="w-4 h-4 mt-0.5 text-gray-300 dark:text-gray-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{card.title}</p>
          {card.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{card.description}</p>
          )}
        </div>
        {/* 按鈕需要 stopPropagation 避免觸發拖曳事件 */}
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            className="text-gray-400 hover:text-blue-500 p-0.5"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onTogglePin(card.id) }}
            className={cn(
              'p-0.5',
              card.is_pinned ? 'text-blue-500 opacity-100' : 'text-gray-400 hover:text-blue-500',
              columnAutoPin && 'cursor-default'
            )}
            title={card.is_pinned ? '取消釘選' : '釘選'}
          >
            {card.is_pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(card.id) }}
            className="text-gray-400 hover:text-red-500 p-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
