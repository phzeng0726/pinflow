import { CardDetailDialog } from '@/pages/board-detail/components/cards/CardDetailDialog'
import { Route } from '@/routes/card-detail'
import { Pencil, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function CardDetailWindow() {
  const { boardId, cardId } = Route.useSearch()
  const { t } = useTranslation()
  const [closeHovered, setCloseHovered] = useState(false)

  useEffect(() => {
    // 讓視窗背景透明，與 Electron transparent: true 配合
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

  return (
    <div className="flex h-screen select-none flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
      {/* 拖曳列 */}
      <div
        className="relative z-[60] flex shrink-0 cursor-grab items-center justify-between bg-blue-600/80 px-3 py-3 text-white dark:bg-blue-700/80"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5 fill-white" />
          <span className="text-sm font-semibold">
            {t('cardDetail.dialogTitle')}
          </span>
        </div>

        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white transition-colors"
            style={{ backgroundColor: closeHovered ? 'rgba(255,255,255,0.2)' : undefined }}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            onClick={() => window.close()}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <CardDetailDialog
        boardId={boardId}
        cardId={cardId}
        onClose={() => window.close()}
        standalone
      />
    </div>
  )
}
