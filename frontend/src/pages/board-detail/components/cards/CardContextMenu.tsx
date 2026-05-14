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
import { useArchiveCard } from '@/hooks/archive/mutations/useArchiveMutations'
import type { Card } from '@/types'
import { Archive, Copy, Pin, PinOff, Trash2 } from 'lucide-react'
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
  const archiveCard = useArchiveCard(boardId)
  const { t } = useTranslation()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  const handlePinCard = (cardId: number) => {
    togglePin.mutate(cardId)
  }

  const handleDeleteCard = (cardId: number) => {
    deleteCard.mutate(cardId)
  }

  const handleDropdownOpenChange = (o: boolean) => {
    if (!o) onOpenChange(false)
  }

  const handleSelectPin = () => {
    handlePinCard(card.id)
    onOpenChange(false)
  }

  const handleSelectDuplicate = () => {
    setShowDuplicate(true)
    onOpenChange(false)
  }

  const handleSelectArchive = () => {
    archiveCard.mutate(card.id)
    onOpenChange(false)
  }

  const handleSelectDelete = () => {
    setShowDeleteConfirm(true)
    onOpenChange(false)
  }

  const handleCloseDuplicateDialog = () => setShowDuplicate(false)

  const handleDeleteDialogOpenChange = (o: boolean) => {
    if (!o) setShowDeleteConfirm(false)
  }

  const handleConfirmDelete = () => {
    handleDeleteCard(card.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={handleDropdownOpenChange}
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
          <DropdownMenuItem onSelect={handleSelectPin}>
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
          <DropdownMenuItem onSelect={handleSelectDuplicate}>
            <Copy className="h-3.5 w-3.5" /> {t('cardMenu.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSelectArchive}>
            <Archive className="h-3.5 w-3.5" /> {t('cardMenu.archive')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleSelectDelete}
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
          onClose={handleCloseDuplicateDialog}
        />
      )}

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={handleDeleteDialogOpenChange}
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
              onClick={handleConfirmDelete}
            >
              {t('cardMenu.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
