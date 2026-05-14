import type { ArchivedCard } from '@/types'
import { Loader2, Trash2, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  card: ArchivedCard
  onRestore: (id: number) => void
  onDelete: (id: number) => void
  isRestoring?: boolean
  disabled?: boolean
}

export function ArchivedCardItem({ card, onRestore, onDelete, isRestoring, disabled }: Props) {
  const { t } = useTranslation()
  const isDisabled = disabled || isRestoring

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {card.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {card.columnName}
          </span>
          {card.columnArchived && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {t('archive.columnArchived')}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {new Date(card.archivedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onRestore(card.id)}
          disabled={isDisabled}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          title={t('archive.restore')}
        >
          {isRestoring ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Undo2 className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          disabled={isDisabled}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title={t('archive.deleteForever')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
