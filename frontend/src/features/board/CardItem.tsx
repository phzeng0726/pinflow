import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Check, CheckSquare, Copy, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
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
  const [showEdit, setShowEdit] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
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

  const openMenu = () => {
    if (!cardRef.current) return
    setCardRect(cardRef.current.getBoundingClientRect())
    setShowEdit(true)
    setShowDropdown(true)
  }

  const handleSave = () => {
    if (!editTitle.trim()) return
    onUpdate(card.id, editTitle.trim(), editDesc)
    setShowEdit(false)
    setShowDropdown(false)
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setEditDesc(card.description)
    setShowEdit(false)
    setShowDropdown(false)
  }

  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.start_time || !!card.end_time
  const totalItems = checklists.reduce((n, cl) => n + (cl.total_count ?? cl.items?.length ?? 0), 0)
  const completedItems = checklists.reduce((n, cl) => n + (cl.completed_count ?? cl.items?.filter(i => i.completed).length ?? 0), 0)

  return (
    <>
      <div
        ref={(el) => { setNodeRef(el); cardRef.current = el }}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (isDragging) return
          if (showEdit) { handleCancel(); return }
          if ((e.target as HTMLElement).closest('[data-card-actions]')) return
          setShowDetail(true)
        }}
        onContextMenu={(e) => { e.preventDefault(); openMenu() }}
        className={cn(
          'rounded-lg p-3 shadow-sm bg-white dark:bg-gray-700',
          card.is_pinned ? 'border border-l-4 border-l-blue-500' : 'border dark:border-gray-600',
          'group relative select-none',
          'cursor-pointer active:cursor-grabbing',
          showEdit && 'ring-2 ring-blue-500 shadow-lg z-[9995]'
        )}
      >
        {showEdit ? (
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
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {tags.slice(0, 3).map(tag => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs rounded px-1.5 py-0.5"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{tags.length - 3}</span>
                  )}
                </div>
              )}
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{card.title}</p>
              {card.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{card.description}</p>
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
                  <span className="text-xs text-gray-400">#{card.id}</span>
                </div>
              )}
            </div>
            {/* Action buttons */}
            <div
              data-card-actions
              className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onPointerDown={e => e.stopPropagation()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); openMenu() }}
                    className="text-gray-400 hover:text-blue-500 p-0.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>編輯</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Context menu / dropdown - always rendered for right-click and edit button */}
        <DropdownMenu open={showDropdown} onOpenChange={(open) => { if (!open) setShowDropdown(false) }}>
          <DropdownMenuTrigger asChild>
            {/* 隱藏的按鈕，用於觸發下拉選單 */}
            <button className="absolute right-0 top-0 w-0 h-0 opacity-0 pointer-events-none" tabIndex={-1} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="min-w-[140px] z-[9995] ml-2"
            onInteractOutside={() => handleCancel()}
          >
            <DropdownMenuItem onSelect={() => { onTogglePin(card.id); setShowDropdown(false) }}>
              {card.is_pinned
                ? <><PinOff className="w-3.5 h-3.5 text-blue-500" /> <span className="text-blue-500">取消釘選</span></>
                : <><Pin className="w-3.5 h-3.5" /> 釘選</>
              }
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setShowDuplicate(true); setShowDropdown(false) }}>
              <Copy className="w-3.5 h-3.5" /> 複製卡片
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => { setShowDeleteConfirm(true); setShowDropdown(false) }}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" /> 刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
      {showEdit && cardRect && createPortal(
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
