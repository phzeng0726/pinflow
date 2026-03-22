import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { useCardDetail } from '../../hooks/card/queries/useCardDetail'
import { CardDetailHeader } from './CardDetailHeader'
import { ChecklistSection } from './ChecklistSection'
import { ScheduleSection } from './ScheduleSection'
import { StoryPointSelector } from './StoryPointSelector'
import { TagSection } from './TagSection'

interface CardDetailDialogProps {
  boardId: number
  cardId: number
  onClose: () => void
}

export function CardDetailDialog(props: CardDetailDialogProps) {
  const { boardId, cardId, onClose } = props

  const { data: card, isLoading } = useCardDetail(cardId)
  const { updateCard } = useCardMutations(boardId)

  const handleStoryPointChange = (sp: number | null) => {
    if (!card) return
    updateCard.mutate({
      id: card.id,
      title: card.title,
      description: card.description,
      storyPoint: sp,
      startTime: card.start_time,
      endTime: card.end_time,
    })
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogTitle className="sr-only">卡片詳情</DialogTitle>
        {isLoading || !card ? (
          <div className="p-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <>
            <CardDetailHeader boardId={boardId} card={card} onClose={onClose} />
            <div className="space-y-6 p-6">
              <StoryPointSelector
                value={card.story_point}
                onChange={handleStoryPointChange}
              />
              <TagSection boardId={boardId} card={card} />
              <ScheduleSection boardId={boardId} card={card} />
              <ChecklistSection boardId={boardId} card={card} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
