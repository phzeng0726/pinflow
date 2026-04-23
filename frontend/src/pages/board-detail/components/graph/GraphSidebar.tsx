import { ChevronLeft, ChevronRight, AlertTriangle, Unlink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGraphViewStore } from '@/stores/graphViewStore'
import { getColumnColor } from '@/lib/styleConfig'
import { getCardUrgency } from '@/lib/dates'
import type { Board, Card } from '@/types'

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

  const allCards: Card[] = (board?.columns ?? []).flatMap((col) => col.cards ?? [])

  const unlinkedCards = allCards.filter((c) => c.dependencyCount === 0)
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
        <div className="relative" title={t('graphView.unlinkedCards')}>
          <Unlink className="h-4 w-4 text-gray-400" />
          {unlinkedCards.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-[9px] text-white">
              {unlinkedCards.length}
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
          <div className="mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('graphView.needsAttention')}
            </span>
            <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {needsAttentionCards.length}
            </span>
          </div>
          {needsAttentionCards.length === 0 ? (
            <p className="text-[11px] text-gray-400">{t('graphView.noNeedsAttention')}</p>
          ) : (
            <ul className="space-y-1">
              {needsAttentionCards.map((card) => {
                const urgency = getCardUrgency(card)
                const isActive = focusedCardId === card.id
                return (
                  <li
                    key={card.id}
                    onClick={() => setFocusedCardId(focusedCardId === card.id ? null : card.id)}
                    onDoubleClick={() => setOpenedCardId(card.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${urgency === 'overdue' ? 'bg-red-500' : 'bg-amber-500'}`}
                    />
                    <span className="line-clamp-1 text-xs text-gray-700 dark:text-gray-300">
                      {card.title}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="mx-3 border-t dark:border-gray-700" />

        {/* Unlinked Cards */}
        <section className="px-3 pt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Unlink className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t('graphView.unlinkedCards')}
            </span>
            <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {unlinkedCards.length}
            </span>
          </div>
          {unlinkedCards.length === 0 ? (
            <p className="text-[11px] text-gray-400">{t('graphView.noUnlinked')}</p>
          ) : (
            <ul className="space-y-1">
              {unlinkedCards.map((card) => {
                const col = board?.columns.find((c) => c.id === card.columnId)
                const colColor = col ? getColumnColor(col.id) : null
                const isActive = focusedCardId === card.id
                return (
                  <li
                    key={card.id}
                    onClick={() => setFocusedCardId(focusedCardId === card.id ? null : card.id)}
                    onDoubleClick={() => setOpenedCardId(card.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {colColor && (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${colColor.bg}`} />
                    )}
                    <span className="line-clamp-1 text-xs text-gray-700 dark:text-gray-300">
                      {card.title}
                    </span>
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
