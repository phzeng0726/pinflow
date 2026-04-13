import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { editCardSchema, type EditCardForm } from '@/lib/schemas'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CheckSquare, Flame, Pencil, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'
import type { Card } from '../../types'
import { CardDetailDialog } from '../card/CardDetailDialog'
import { getTagColorClasses } from '../card/ColorPicker'
import { CardContextMenu } from './CardContextMenu'

interface CardItemProps {
  card: Card
  boardId: number
  columnAutoPin: boolean
}

export function CardItem(props: CardItemProps) {
  const { card, boardId } = props

  const [showDetail, setShowDetail] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const { updateCard } = useCardMutations(boardId)

  const { register, handleSubmit, reset } = useForm<EditCardForm>({
    defaultValues: { title: card.title },
    resolver: zodResolver(editCardSchema),
  })

  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardRect, setCardRect] = useState<DOMRect | null>(null)

  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.startTime || !!card.endTime
  const totalItems = checklists.reduce(
    (n, cl) => n + (cl.totalCount ?? cl.items?.length ?? 0),
    0,
  )
  const completedItems = checklists.reduce(
    (n, cl) =>
      n +
      (cl.completedCount ?? cl.items?.filter((i) => i.completed).length ?? 0),
    0,
  )

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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

  const onSubmit = async (form: EditCardForm) => {
    await updateCard.mutateAsync({
      id: card.id,
      form: {
        title: form.title,
        description: form.description,
      },
    })
    setShowMenu(false)
  }

  const handleCancel = () => {
    reset()
    setShowMenu(false)
  }

  return (
    <>
      <div
        ref={(el) => {
          setNodeRef(el)
          cardRef.current = el
        }}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (isDragging) return
          if (showMenu) {
            handleCancel()
            return
          }
          if ((e.target as HTMLElement).closest('[data-card-actions]')) return
          setShowDetail(true)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          openMenu()
        }}
        className={cn(
          'rounded-lg bg-white p-3 shadow-sm dark:bg-gray-700',
          card.isPinned
            ? 'border border-l-4 border-l-blue-500'
            : 'border dark:border-gray-600',
          'group relative select-none',
          'cursor-pointer active:cursor-grabbing',
          showMenu && 'z-[9995] shadow-lg ring-2 ring-blue-500',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
        )}
      >
        {showMenu ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Textarea
              {...register('title')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel()
              }}
              className="mb-2 resize-none font-medium"
              rows={3}
              autoFocus
            />
            <div className="flex gap-1">
              <Button type="submit" size="sm" className="h-7 text-xs">
                儲存
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                className="h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {tags.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag) => {
                    const colorCls = getTagColorClasses(tag.color)
                    return (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          tag.color &&
                            `${colorCls.bg} border-transparent text-white`,
                        )}
                      >
                        {tag.name}
                      </Badge>
                    )
                  })}
                  {tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                {card.title}
              </p>
              {card.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {card.description}
                </p>
              )}
              {(card.storyPoint != null || hasSchedule || totalItems > 0) && (
                <div className="mt-1.5 flex items-center gap-2">
                  {card.storyPoint != null && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <Flame className="h-3 w-3" />
                      {card.storyPoint}
                    </span>
                  )}
                  {hasSchedule && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {card.startTime
                        ? new Date(card.startTime).toLocaleDateString()
                        : ''}
                    </span>
                  )}
                  {totalItems > 0 && (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 text-xs',
                        completedItems === totalItems
                          ? 'text-green-500'
                          : 'text-gray-400',
                      )}
                    >
                      <CheckSquare className="h-3 w-3" />
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
              className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openMenu()
                    }}
                    className="p-0.5 text-gray-400 hover:text-blue-500"
                  >
                    <Pencil className="h-3.5 w-3.5" />
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
        />
      </div>

      {/* Backdrop panels that expose only the card area */}
      {showMenu &&
        cardRect &&
        createPortal(
          <>
            <div
              className="fixed inset-x-0 top-0 z-[9990] bg-black/40"
              style={{ height: cardRect.top }}
              onClick={handleCancel}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[9990] bg-black/40"
              style={{ top: cardRect.bottom }}
              onClick={handleCancel}
            />
            <div
              className="fixed left-0 z-[9990] bg-black/40"
              style={{
                top: cardRect.top,
                height: cardRect.height,
                width: cardRect.left,
              }}
              onClick={handleCancel}
            />
            <div
              className="fixed right-0 z-[9990] bg-black/40"
              style={{
                top: cardRect.top,
                height: cardRect.height,
                left: cardRect.right,
              }}
              onClick={handleCancel}
            />
          </>,
          document.body,
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
