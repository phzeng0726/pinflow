import { queryKeys } from '@/hooks/queryKeys'
import * as api from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function usePinChecklistToggle(boardId: number, cardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      api.updateChecklistItem(id, { completed }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.cards.detail(cardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() }),
      ])
    },
    onError: () => toast.error(t('toast.checklist.itemUpdateError')),
  })
}
