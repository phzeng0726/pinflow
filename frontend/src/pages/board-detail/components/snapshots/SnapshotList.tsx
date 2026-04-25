import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhTW, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import type { BoardSnapshot } from '@/types'

interface SnapshotListProps {
  snapshots: BoardSnapshot[]
  onRestore: (id: number) => void
  onDelete: (id: number) => void
  isPending: boolean
}

const KNOWN_TRIGGERS = [
  'manual',
  'delete_card',
  'delete_column',
  'create_card',
  'create_column',
  'update_card',
  'move_card',
  'restore',
] as const

type KnownTrigger = (typeof KNOWN_TRIGGERS)[number]

const isKnownTrigger = (trigger: string): trigger is KnownTrigger =>
  (KNOWN_TRIGGERS as readonly string[]).includes(trigger)

export function SnapshotList({ snapshots, onRestore, onDelete, isPending }: SnapshotListProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'zh-TW' ? zhTW : enUS

  const getTriggerLabel = (trigger: string): string =>
    isKnownTrigger(trigger) ? t(`snapshot.trigger.${trigger}`) : trigger

  if (snapshots.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">{t('snapshot.noSnapshots')}</p>
  }

  return (
    <ul className="space-y-2">
      {snapshots.map((snap) => (
        <li
          key={snap.id}
          className="flex items-center gap-2 rounded-lg border p-3 text-sm dark:border-gray-700"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{snap.name}</p>
            <p className="text-xs text-gray-400">
              {getTriggerLabel(snap.trigger)}
              {' · '}
              {formatDistanceToNow(new Date(snap.createdAt), { addSuffix: true, locale })}
            </p>
          </div>
          {snap.isManual && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {t('snapshot.manual')}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            disabled={isPending}
            onClick={() => onRestore(snap.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600"
            disabled={isPending}
            onClick={() => onDelete(snap.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  )
}
