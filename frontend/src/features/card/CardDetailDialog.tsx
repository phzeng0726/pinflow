import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent } from '../../components/ui/dialog'
import { getCard } from '../../lib/api'
import { CardDetailHeader } from './CardDetailHeader'
import { ChecklistSection } from './ChecklistSection'
import { ScheduleSection } from './ScheduleSection'
import { TagSection } from './TagSection'

interface CardDetailDialogProps {
  cardId: number
  onClose: () => void
}

export function CardDetailDialog({ cardId, onClose }: CardDetailDialogProps) {
  const qc = useQueryClient()
  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => getCard(cardId),
  })

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading || !card ? (
          <div className="p-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <>
            <CardDetailHeader card={card} onClose={onClose} qc={qc} />
            <div className="p-6 space-y-6">
              <TagSection card={card} />
              <ScheduleSection card={card} qc={qc} />
              <ChecklistSection card={card} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
