import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { formatScheduleSummary } from '@/lib/dates'
import type { Card } from '@/types'
import { Calendar, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SchedulePopoverProps {
  boardId: number
  card: Card
}

export function SchedulePopover(props: SchedulePopoverProps) {
  const { boardId, card } = props
  const { updateSchedule } = useCardMutations(boardId)
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStartTime(card.startTime ?? null)
      setEndTime(card.endTime ?? null)
      setError(null)
      setOpen(true)
      return
    }

    if (startTime && endTime && endTime <= startTime) {
      setError(t('schedule.endBeforeStart'))
      return
    }

    const changed =
      startTime !== (card.startTime ?? null) ||
      endTime !== (card.endTime ?? null)

    if (changed) {
      updateSchedule.mutate({ id: card.id, startTime, endTime })
    }

    setError(null)
    setOpen(false)
  }

  const handleClearAll = () => {
    updateSchedule.mutate({ id: card.id, startTime: null, endTime: null })
    setError(null)
    setOpen(false)
  }

  const handleClose = () => handleOpenChange(false)

  const handleStartTimeChange = (iso: string | null) => {
    setStartTime(iso)
    setError(null)
  }

  const handleEndTimeChange = (iso: string | null) => {
    setEndTime(iso)
    setError(null)
  }

  const summary = formatScheduleSummary(
    card.startTime ?? null,
    card.endTime ?? null,
  )
  const hasAnyDate = !!(card.startTime || card.endTime)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={hasAnyDate ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2 text-xs font-medium"
        >
          {summary ?? <Calendar className="h-3.5 w-3.5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('schedule.title')}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 py-3">
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                {t('schedule.startTime')}
              </Label>
              <DateTimePicker
                value={startTime}
                onChange={handleStartTimeChange}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                {t('schedule.endTime')}
              </Label>
              <DateTimePicker value={endTime} onChange={handleEndTimeChange} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          {hasAnyDate && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-3 w-full rounded py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
            >
              {t('schedule.clearAll')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
