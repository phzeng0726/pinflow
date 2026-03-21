import { Pin, X } from 'lucide-react'
import type React from 'react'
import { useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { usePinnedCards } from '../../hooks/card/queries/useCards'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { usePinStore } from '../../stores/pinStore'
import { PinnedCardItem } from './PinnedCardItem'

export function PinWindow() {
  const { data: cards = [] } = usePinnedCards()
  const { close } = usePinStore()
  const { togglePinFromPin: togglePin } = useCardMutations()

  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById('root')]
    targets.forEach(el => { if (el) el.style.background = 'transparent' })
    return () => {
      targets.forEach(el => { if (el) el.style.background = '' })
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white/70 dark:bg-gray-900/90 select-none rounded-2xl overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-3 bg-blue-600/80 dark:bg-blue-700/80 text-white shrink-0 cursor-move"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5">
          <Pin className="w-3.5 h-3.5 fill-white" />
          <span className="text-sm font-semibold">
            釘選任務
            {cards.length > 0 && (
              <span className="ml-1.5 bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full">
                {cards.length}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-white/20 text-white"
            onClick={() => {
              const api = (window as any).electronAPI
              if (api?.hidePinWindow) api.hidePinWindow()
              else close()
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 dark:text-gray-500">
            <Pin className="w-6 h-6 mb-1 opacity-30" />
            <p className="text-xs">尚無釘選任務</p>
          </div>
        ) : (
          cards.map(card => (
            <PinnedCardItem
              key={card.id}
              card={card}
              onUnpin={(id) => togglePin.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
