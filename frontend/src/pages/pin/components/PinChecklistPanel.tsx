import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCardDetail } from '@/hooks/card/queries/useCardDetail'
import { usePinChecklistToggle } from '@/hooks/checklist/mutations/usePinChecklistToggle'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PinChecklistPanelProps {
  cardId: number
  boardId: number
}

export function PinChecklistPanel({ cardId, boardId }: PinChecklistPanelProps) {
  const { t } = useTranslation()
  const { data: card, isLoading } = useCardDetail(cardId)
  const toggle = usePinChecklistToggle(boardId, cardId)

  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(
    null,
  )

  const checklists = useMemo(() => {
    if (!card?.checklists) return []
    return [...card.checklists]
      .sort((a, b) => a.position - b.position)
      .filter((cl) => (cl.items?.length ?? cl.totalCount ?? 0) > 0)
  }, [card])

  const defaultChecklistId = useMemo(() => {
    if (checklists.length === 0) return null
    const withIncomplete = checklists.find((cl) =>
      (cl.items ?? []).some((item) => !item.completed),
    )
    return (withIncomplete ?? checklists[0]).id
  }, [checklists])

  const isValidSelection =
    selectedChecklistId !== null &&
    checklists.some((cl) => cl.id === selectedChecklistId)
  const effectiveChecklistId = isValidSelection ? selectedChecklistId : defaultChecklistId

  const selectedChecklist = checklists.find((cl) => cl.id === effectiveChecklistId)
  const items = selectedChecklist?.items ?? []

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center justify-center py-3">
        <LoadingSpinner variant="inline" />
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      {checklists.length > 1 && (
        <Select
          value={effectiveChecklistId?.toString() ?? ''}
          onValueChange={(val) => setSelectedChecklistId(Number(val))}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {checklists.map((cl) => {
              const total = cl.items?.length ?? cl.totalCount ?? 0
              const completed =
                cl.items?.filter((i) => i.completed).length ??
                cl.completedCount ??
                0
              const allDone = total > 0 && completed === total
              return (
                <SelectItem
                  key={cl.id}
                  value={cl.id.toString()}
                  className="text-xs"
                >
                  {cl.title}{' '}
                  <span className={allDone ? 'text-green-500' : ''}>
                    ({completed}/{total})
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{t('pin.noChecklistItems')}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <Checkbox
                id={`pin-item-${item.id}`}
                checked={item.completed}
                onCheckedChange={(checked) =>
                  toggle.mutate({ id: item.id, completed: !!checked })
                }
                className="h-3.5 w-3.5 shrink-0"
              />
              <Label
                htmlFor={`pin-item-${item.id}`}
                className={cn(
                  'cursor-pointer text-xs leading-snug',
                  item.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-700 dark:text-gray-300',
                )}
              >
                {item.text}
              </Label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
