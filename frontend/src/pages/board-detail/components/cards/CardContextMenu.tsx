import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { Copy, Pin, PinOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
import type { Card } from '@/types'
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
                <span className="text-blue-500">取消釘選</span>
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" /> 釘選
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowDuplicate(true)
              onOpenChange(false)
            }}
          >
            <Copy className="h-3.5 w-3.5" /> 複製卡片
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setShowDeleteConfirm(true)
              onOpenChange(false)
            }}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> 刪除
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
            <AlertDialogTitle>刪除卡片</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{card.title}」？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                handleDeleteCard(card.id)
                setShowDeleteConfirm(false)
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
