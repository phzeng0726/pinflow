import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Check, CheckSquare, Copy, GripVertical, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../lib/utils'
import type { Card } from '../../types'
import { CardDetailDialog } from '../card/CardDetailDialog'
import { DuplicateCardDialog } from '../card/DuplicateCardDialog'

interface CardItemProps {
  card: Card
  boardId: number
  columnAutoPin: boolean
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, title: string, description: string) => void
}

export function CardItem({ card, boardId, onTogglePin, onDelete, onUpdate }: CardItemProps) {
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDesc, setEditDesc] = useState(card.description)
  const [showDetail, setShowDetail] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardRect, setCardRect] = useState<DOMRect | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setCardRect(rect)
    const menuLeft = rect.right + 8 + 160 > window.innerWidth
      ? rect.left - 168
      : rect.right + 8
    setMenuPos({ top: rect.top, left: menuLeft })
    setShowMenu(true)
  }

  const handleSave = () => {
    if (!editTitle.trim()) return
    onUpdate(card.id, editTitle.trim(), editDesc)
    setShowMenu(false)
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setEditDesc(card.description)
    setShowMenu(false)
  }

  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.start_time || !!card.end_time
  const totalItems = checklists.reduce((n, cl) => n + (cl.total_count ?? 0), 0)
  const completedItems = checklists.reduce((n, cl) => n + (cl.completed_count ?? 0), 0)

  useEffect(() => {
    if (!showMenu || !cardRef.current) return
    const id = requestAnimationFrame(() => {
      if (cardRef.current) setCardRect(cardRef.current.getBoundingClientRect())
    })
    return () => cancelAnimationFrame(id)
  }, [showMenu])

  return (
    <>
      <div
        ref={(el) => { setNodeRef(el); cardRef.current = el }}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (isDragging) return
          if (showMenu) { setShowMenu(false); return }
          if ((e.target as HTMLElement).closest('[data-card-actions]')) return
          setShowDetail(true)
        }}
        onContextMenu={openMenu}
        className={cn(
          'bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-3 shadow-sm',
          'group relative select-none',
          'cursor-pointer active:cursor-grabbing',
          card.is_pinned && 'border-l-4 border-l-yellow-500',
          showMenu && 'ring-2 ring-blue-500 shadow-lg'
        )}
      >
        {showMenu ? (
          <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
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
        ) : <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 mt-0.5 text-gray-300 dark:text-gray-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{card.title}</p>
            {card.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{card.description}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.slice(0, 3).map(tag => (
                  <span
                    key={tag.id}
                    className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs"
                  >
                    {tag.name}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{tags.length - 3}</span>
                )}
              </div>
            )}
            {(hasSchedule || totalItems > 0) && (
              <div className="flex items-center gap-2 mt-1.5">
                {hasSchedule && (
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {card.start_time ? new Date(card.start_time).toLocaleDateString() : ''}
                  </span>
                )}
                {totalItems > 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-xs',
                    completedItems === totalItems ? 'text-green-500' : 'text-gray-400'
                  )}>
                    <CheckSquare className="w-3 h-3" />
                    {completedItems}/{totalItems}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Action buttons */}
          <div
            data-card-actions
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onPointerDown={e => e.stopPropagation()}
          >
            <button
              onClick={e => { e.stopPropagation(); openMenu(e) }}
              className="text-gray-400 hover:text-blue-500 p-0.5"
              title="編輯"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>}


        {/* Inline delete confirmation */}
        {showDeleteConfirm && (
          <div
            className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            onPointerDown={e => e.stopPropagation()}
          >
            <p className="text-xs text-red-700 dark:text-red-300 mb-2">確定刪除此卡片？</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs px-2"
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); setShowDeleteConfirm(false) }}
              >
                確定
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop panels that expose only the card area */}
      {showMenu && cardRect && createPortal(
        <>
          <div className="fixed inset-x-0 top-0 bg-black/40 z-[9990]"
            style={{ height: cardRect.top }} onClick={handleCancel} />
          <div className="fixed inset-x-0 bottom-0 bg-black/40 z-[9990]"
            style={{ top: cardRect.bottom }} onClick={handleCancel} />
          <div className="fixed left-0 bg-black/40 z-[9990]"
            style={{ top: cardRect.top, height: cardRect.height, width: cardRect.left }}
            onClick={handleCancel} />
          <div className="fixed right-0 bg-black/40 z-[9990]"
            style={{ top: cardRect.top, height: cardRect.height, left: cardRect.right }}
            onClick={handleCancel} />
        </>,
        document.body
      )}

      {/* Floating context menu rendered via portal */}
      {showMenu && createPortal(
        <div
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => { onTogglePin(card.id); setShowMenu(false) }}
          >
            {card.is_pinned
              ? <><PinOff className="w-3.5 h-3.5" /> 取消釘選</>
              : <><Pin className="w-3.5 h-3.5" /> 釘選</>
            }
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => { setShowDuplicate(true); setShowMenu(false) }}
          >
            <Copy className="w-3.5 h-3.5" /> 複製卡片
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
          >
            <Trash2 className="w-3.5 h-3.5" /> 刪除
          </button>
        </div>,
        document.body
      )}

      {showDetail && (
        <CardDetailDialog cardId={card.id} onClose={() => setShowDetail(false)} />
      )}

      {showDuplicate && (
        <DuplicateCardDialog
          card={card}
          boardId={boardId}
          onClose={() => setShowDuplicate(false)}
        />
      )}
    </>
  )
}
