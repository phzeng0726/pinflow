import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGraphViewStore } from '@/stores/graphViewStore'
import type { Board } from '@/types'

interface GraphFocusBannerProps {
  cardId: number
  board: Board
}

export function GraphFocusBanner({ cardId, board }: GraphFocusBannerProps) {
  const { t } = useTranslation()
  const setFocusedCardId = useGraphViewStore((s) => s.setFocusedCardId)

  const card = board.columns
    .flatMap((col) => col.cards ?? [])
    .find((c) => c.id === cardId)

  if (!card) return null

  return (
    <div className="absolute left-1/2 top-[60px] z-20 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 shadow dark:border-blue-800 dark:bg-blue-900/40">
        <span className="text-xs text-blue-700 dark:text-blue-300">
          {t('graphView.focusingOn')}{' '}
          <strong className="font-semibold">{card.title}</strong>
        </span>
        <button
          onClick={() => setFocusedCardId(null)}
          className="ml-2 flex items-center gap-1 rounded border border-blue-300 px-1.5 py-0.5 text-xs text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-800"
        >
          <X className="h-3 w-3" />
          {t('graphView.exitFocus')}
        </button>
      </div>
    </div>
  )
}
