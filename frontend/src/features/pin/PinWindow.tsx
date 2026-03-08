import { Pin, Minus, X } from 'lucide-react'
import { usePinnedCards, useTogglePinFromPin } from '../../hooks/useCards'
import { usePinStore } from '../../stores/pinStore'
import { PinnedCardItem } from './PinnedCardItem'

export function PinWindow() {
  const { data: cards = [] } = usePinnedCards()
  const { isMinimized, close, toggleMinimize } = usePinStore()
  const togglePin = useTogglePinFromPin()

  return (
    <div className="flex flex-col h-screen bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm select-none">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white shrink-0 cursor-move">
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
        <div className="flex items-center gap-1">
          <button onClick={toggleMinimize} className="hover:bg-white/20 rounded p-0.5 transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={close} className="hover:bg-white/20 rounded p-0.5 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card list */}
      {!isMinimized && (
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
      )}
    </div>
  )
}
