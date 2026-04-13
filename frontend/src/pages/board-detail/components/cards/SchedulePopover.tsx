import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import type { Card } from '@/types'
import { format, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useState } from 'react'

interface SchedulePopoverProps {
  boardId: number
  card: Card
}

function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return format(parseISO(iso), 'yyyy/M/d')
  } catch {
    return null
  }
}

function buildSummary(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const start = formatShortDate(startTime)
  const end = formatShortDate(endTime)
  if (start && end) return `${start} → ${end}`
  if (start) return `${start} →`
  if (end) return `→ ${end}`
  return null
}

export function SchedulePopover(props: SchedulePopoverProps) {
  const { boardId, card } = props
  const { updateSchedule } = useCardMutations(boardId)

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
      setError('結束時間不能早於開始時間')
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

  const summary = buildSummary(card.startTime ?? null, card.endTime ?? null)
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
      <PopoverContent className="w-72 p-3" align="start">
        <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
          Schedule
        </p>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              開始時間
            </Label>
            <DateTimePicker
              value={startTime}
              onChange={(iso) => {
                setStartTime(iso)
                setError(null)
              }}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              結束時間
            </Label>
            <DateTimePicker
              value={endTime}
              onChange={(iso) => {
                setEndTime(iso)
                setError(null)
              }}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        {hasAnyDate && (
          <button
            type="button"
            onClick={handleClearAll}
            className="mt-3 w-full rounded py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
          >
            清除全部
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
