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
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import type { Card } from '@/types'
import { Copy, Pin, PinOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DuplicateCardDialog } from './DuplicateCardDialog'

interface CardContextMenuProps {
  card: Card
  boardId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardContextMenu(props: CardContextMenuProps) {
  const { card, boardId, open, onOpenChange } = props

  const { togglePin, deleteCard } = useCardMutations(boardId)
  const { t } = useTranslation()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  const handlePinCard = (cardId: number) => {
    togglePin.mutate(cardId)
  }

  const handleDeleteCard = (cardId: number) => {
    deleteCard.mutate(cardId)
  }

  return (
    <>
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(o) => {
          if (!o) onOpenChange(false)
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            className="pointer-events-none absolute right-0 top-0 h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="z-[9995] ml-2 min-w-[140px]"
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={() => {
              handlePinCard(card.id)
              onOpenChange(false)
            }}
          >
            {card.isPinned ? (
              <>
                <PinOff className="h-3.5 w-3.5 text-blue-500" />{' '}
                <span className="text-blue-500">{t('cardMenu.unpin')}</span>
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" /> {t('cardMenu.pin')}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowDuplicate(true)
              onOpenChange(false)
            }}
          >
            <Copy className="h-3.5 w-3.5" /> {t('cardMenu.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setShowDeleteConfirm(true)
              onOpenChange(false)
            }}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t('cardMenu.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showDuplicate && (
        <DuplicateCardDialog
          card={card}
          boardId={boardId}
          onClose={() => setShowDuplicate(false)}
        />
      )}

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(o) => {
          if (!o) setShowDeleteConfirm(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cardMenu.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cardMenu.deleteDesc', { title: card.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cardMenu.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                handleDeleteCard(card.id)
                setShowDeleteConfirm(false)
              }}
            >
              {t('cardMenu.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
