import { Minus, Pin, X } from 'lucide-react'
import type React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { usePinnedCards } from '@/hooks/card/queries/usePinnedCards'
import { usePinStore } from '@/stores/pinStore'
import { PinnedCardItem } from './components/PinnedCardItem'

export function PinWindow() {
  const { t } = useTranslation()
  const { data: cards = [] } = usePinnedCards()
  const close = usePinStore((s) => s.close)
  const { togglePinFromPin: togglePin } = useCardMutations()

  useEffect(() => {
    const targets = [
      document.documentElement,
      document.body,
      document.getElementById('root'),
    ]
    targets.forEach((el) => {
      if (el) el.style.background = 'transparent'
    })
    return () => {
      targets.forEach((el) => {
        if (el) el.style.background = ''
      })
    }
  }, [])

  const handleCardEdit = (card: Parameters<typeof PinnedCardItem>[0]['card']) => {
    window.electronAPI?.openCardDetail?.(card.boardId, card.id)
  }

  return (
    <div className="flex h-screen select-none flex-col overflow-hidden rounded-2xl bg-white/70 shadow-2xl dark:bg-gray-900/90">
      {/* Title bar */}
      <div
        className="flex shrink-0 cursor-grab items-center justify-between bg-blue-600/80 px-3 py-3 text-white dark:bg-blue-700/80"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5">
          <Pin className="h-3.5 w-3.5 fill-white" />
          <span className="text-sm font-semibold">
            {t('pin.pinnedTasks')}
            {cards.length > 0 && (
              <span className="ml-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-xs text-white">
                {cards.length}
              </span>
            )}
          </span>
        </div>
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20"
            onClick={() => window.electronAPI?.minimizeWindow?.()}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20"
            onClick={() => {
              if (window.electronAPI?.hidePinWindow) window.electronAPI.hidePinWindow()
              else close()
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {cards.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Pin className="mb-1 h-6 w-6 opacity-30" />
            <p className="text-xs">{t('pin.noPinnedTasks')}</p>
          </div>
        ) : (
          cards.map((card) => (
            <PinnedCardItem
              key={card.id}
              card={card}
              onUnpin={(id) => togglePin.mutate(id)}
              onEdit={handleCardEdit}
            />
          ))
        )}
      </div>
    </div>
  )
}
