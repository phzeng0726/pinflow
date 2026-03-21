import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CheckSquare, Pencil, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { cardSchema } from '../../lib/schemas'
import { cn } from '../../lib/utils'
import type { Card } from '../../types'
import { CardDetailDialog } from '../card/CardDetailDialog'
import { CardContextMenu } from './CardContextMenu'

type CardFormValues = z.infer<typeof cardSchema>

interface CardItemProps {
  card: Card
  boardId: number
  columnAutoPin: boolean
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, title: string, description: string) => void
}

export function CardItem({ card, boardId, onTogglePin, onDelete, onUpdate }: CardItemProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const { register, handleSubmit, reset } = useForm<CardFormValues>({
    defaultValues: { title: card.title },
    resolver: zodResolver(cardSchema),
  })

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
    setShowMenu(true)
  }

  const onSubmit = ({ title }: CardFormValues) => {
    onUpdate(card.id, title, card.description)
    setShowMenu(false)
  }

  const handleCancel = () => {
    reset({ title: card.title })
    setShowMenu(false)
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
          if (showMenu) { handleCancel(); return }
          if ((e.target as HTMLElement).closest('[data-card-actions]')) return
          setShowDetail(true)
        }}
        onContextMenu={(e) => { e.preventDefault(); openMenu() }}
        className={cn(
          'rounded-lg p-3 shadow-sm bg-white dark:bg-gray-700',
          card.is_pinned ? 'border border-l-4 border-l-blue-500' : 'border dark:border-gray-600',
          'group relative select-none',
          'cursor-pointer active:cursor-grabbing',
          showMenu && 'ring-2 ring-blue-500 shadow-lg z-[9995]'
        )}
      >
        {showMenu ? (
          <form onSubmit={handleSubmit(onSubmit)} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <Textarea
              {...register('title')}
              onKeyDown={e => { if (e.key === 'Escape') handleCancel() }}
              className="mb-2 font-medium resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-1">
              <Button type="submit" size="sm" className="h-7 text-xs">儲存</Button>
              <Button type="button" size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7"><X className="w-3 h-3" /></Button>
            </div>
          </form>
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
        <CardContextMenu
          card={card}
          boardId={boardId}
          open={showMenu}
          onOpenChange={setShowMenu}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />

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

      {showDetail && (
        <CardDetailDialog
          boardId={boardId}
          cardId={card.id}
          onClose={() => setShowDetail(false)}
        />
      )}

    </>
  )
}
