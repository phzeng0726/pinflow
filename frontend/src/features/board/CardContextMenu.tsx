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
} from '../../components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import type { Card } from '../../types'
import { DuplicateCardDialog } from '../card/DuplicateCardDialog'

interface CardContextMenuProps {
  card: Card
  boardId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
}

export function CardContextMenu({
  card,
  boardId,
  open,
  onOpenChange,
  onTogglePin,
  onDelete,
}: CardContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  return (
    <>
      <DropdownMenu modal={false} open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
        <DropdownMenuTrigger asChild>
          <button className="absolute right-0 top-0 w-0 h-0 opacity-0 pointer-events-none" tabIndex={-1} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="min-w-[140px] z-[9995] ml-2"
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onSelect={() => { onTogglePin(card.id); onOpenChange(false) }}>
            {card.is_pinned
              ? <><PinOff className="w-3.5 h-3.5 text-blue-500" /> <span className="text-blue-500">取消釘選</span></>
              : <><Pin className="w-3.5 h-3.5" /> 釘選</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => { setShowDuplicate(true); onOpenChange(false) }}>
            <Copy className="w-3.5 h-3.5" /> 複製卡片
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => { setShowDeleteConfirm(true); onOpenChange(false) }}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" /> 刪除
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={(o) => { if (!o) setShowDeleteConfirm(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除卡片</AlertDialogTitle>
            <AlertDialogDescription>確定要刪除「{card.title}」？此操作無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => { onDelete(card.id); setShowDeleteConfirm(false) }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
