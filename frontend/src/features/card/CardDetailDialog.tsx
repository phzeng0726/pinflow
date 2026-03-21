import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog'
import { useCardDetail } from '../../hooks/card/queries/useCardDetail'
import { CardDetailHeader } from './CardDetailHeader'
import { ChecklistSection } from './ChecklistSection'
import { ScheduleSection } from './ScheduleSection'
import { TagSection } from './TagSection'

interface CardDetailDialogProps {
  boardId: number
  cardId: number
  onClose: () => void
}

export function CardDetailDialog({ boardId, cardId, onClose }: CardDetailDialogProps) {
  const { data: card, isLoading } = useCardDetail(cardId)

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">卡片詳情</DialogTitle>
        {isLoading || !card ? (
          <div className="p-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <>
            <CardDetailHeader boardId={boardId} card={card} onClose={onClose} />
            <div className="p-6 space-y-6">
              <TagSection boardId={boardId} card={card} />
              <ScheduleSection card={card} />
              <ChecklistSection card={card} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
