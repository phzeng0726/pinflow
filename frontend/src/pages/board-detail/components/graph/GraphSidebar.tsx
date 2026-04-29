import { getCardUrgency } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useGraphViewStore } from '@/stores/graphViewStore'
import type { Board, Card } from '@/types'
import { AlertTriangle, ChevronLeft, ChevronRight, Unlink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface GraphSidebarProps {
  board: Board | undefined
}

export function GraphSidebar({ board }: GraphSidebarProps) {
  const { t } = useTranslation()
  const sidebarOpen = useGraphViewStore((s) => s.sidebarOpen)
  const setSidebarOpen = useGraphViewStore((s) => s.setSidebarOpen)
  const focusedCardId = useGraphViewStore((s) => s.focusedCardId)
  const setFocusedCardId = useGraphViewStore((s) => s.setFocusedCardId)
  const setOpenedCardId = useGraphViewStore((s) => s.setOpenedCardId)

  const allCards: Card[] = (board?.columns ?? []).flatMap(
    (col) => col.cards ?? [],
  )

  const unlinked = allCards.filter((c) => c.dependencyCount === 0)
  const needsAttentionCards = allCards.filter((c) => {
    const u = getCardUrgency(c)
    return u === 'overdue' || u === 'due-soon'
  })

  const collapseBtn = (
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:hover:text-gray-200"
    >
      {sidebarOpen ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  )

  if (!sidebarOpen) {
    return (
      <div className="relative flex w-10 shrink-0 flex-col items-center gap-3 border-r bg-white pt-4 dark:border-gray-700 dark:bg-gray-800">
        {collapseBtn}
        {/* Needs attention badge */}
        <div className="relative mt-2" title={t('graphView.needsAttention')}>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {needsAttentionCards.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white">
              {needsAttentionCards.length}
            </span>
          )}
        </div>

        {/* Unlinked badge */}
        <div className="relative" title={t('graphView.unlinked')}>
          <Unlink className="h-4 w-4 text-gray-400" />
          {unlinked.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-[9px] text-white">
              {unlinked.length}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-60 shrink-0 flex-col border-r bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {t('graphView.sidebarTitle')}
        </span>
        {collapseBtn}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Needs Attention */}
        <section className="px-3 pb-3">
          {/* Needs Attention Header */}
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('graphView.needsAttention')}
            </span>
            <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {needsAttentionCards.length}
            </span>
          </div>

          {/* Needs Attention Cards List */}
          {needsAttentionCards.length === 0 ? (
            <p className="text-[11px] text-gray-400">
              {t('graphView.noNeedsAttention')}
            </p>
          ) : (
            <ul className="space-y-1">
              {needsAttentionCards.map((card) => {
                const isActive = focusedCardId === card.id
                const col = board?.columns.find((c) => c.id === card.columnId)
                const dueBadge = getDueBadge(card)

                return (
                  <li
                    key={card.id}
                    onClick={() =>
                      setFocusedCardId(
                        focusedCardId === card.id ? null : card.id,
                      )
                    }
                    onDoubleClick={() => setOpenedCardId(card.id)}
                    className={cn(
                      'flex cursor-pointer flex-col rounded-md px-2.5 py-2 transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                    )}
                  >
                    <span className="line-clamp-1 text-xs text-gray-700 dark:text-gray-300">
                      {card.title}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="line-clamp-1 flex-1 text-[10px] text-gray-400 dark:text-gray-500">
                        {col?.name} #{card.id}
                      </span>
                      {dueBadge && (
                        <span
                          className={cn(
                            'shrink-0 text-[10px] font-medium',
                            dueBadge.isOverdue
                              ? 'text-red-500'
                              : 'text-amber-500',
                          )}
                        >
                          {dueBadge.label}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="mx-3 border-t dark:border-gray-700" />

        {/* Unlinked Cards */}
        <section className="px-3 pt-3">
          {/* Unlinked Cards Header */}
          <div className="mb-2 flex items-center gap-1.5">
            <Unlink className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('graphView.unlinked')}
            </span>
            <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {unlinked.length}
            </span>
          </div>

          {/* Unlinked Cards List */}
          {unlinked.length === 0 ? (
            <p className="text-[11px] text-gray-400">
              {t('graphView.noUnlinked')}
            </p>
          ) : (
            <ul className="space-y-1">
              {unlinked.map((card) => {
                const col = board?.columns.find((c) => c.id === card.columnId)
                const isActive = focusedCardId === card.id

                return (
                  <li
                    key={card.id}
                    onClick={() =>
                      setFocusedCardId(
                        focusedCardId === card.id ? null : card.id,
                      )
                    }
                    onDoubleClick={() => setOpenedCardId(card.id)}
                    className={cn(
                      'flex cursor-pointer flex-col rounded-md px-2.5 py-2 transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                    )}
                  >
                    <span className="line-clamp-1 text-xs text-gray-700 dark:text-gray-300">
                      {card.title}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {col?.name} #{card.id}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function getDueBadge(card: Card): { label: string; isOverdue: boolean } | null {
  const urgency = getCardUrgency(card)
  if (!card.endTime || (urgency !== 'overdue' && urgency !== 'due-soon')) {
    return null
  }

  const diffDays =
    (new Date(card.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)

  if (urgency === 'overdue') {
    return {
      label: `${Math.ceil(Math.abs(diffDays))}d overdue`,
      isOverdue: true,
    }
  }

  if (diffDays < 1) {
    return { label: 'due today', isOverdue: false }
  }

  return { label: `due in ${Math.ceil(diffDays)}d`, isOverdue: false }
}
