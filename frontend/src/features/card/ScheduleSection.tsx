import { Calendar } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { DateTimePicker } from '../../components/ui/date-time-picker'
import { Label } from '../../components/ui/label'
import { updateCard } from '../../lib/api'
import { scheduleSchema } from '../../lib/schemas'
import type { Card } from '../../types'
import type { z } from 'zod'

type ScheduleForm = z.infer<typeof scheduleSchema>

interface ScheduleSectionProps {
  card: Card
  qc: ReturnType<typeof useQueryClient>
}

export function ScheduleSection({ card, qc }: ScheduleSectionProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      startTime: card.start_time ?? '',
      endTime: card.end_time ?? '',
    },
  })

  const onSubmit = async (data: ScheduleForm) => {
    const start = data.startTime || null
    const end = data.endTime || null
    await updateCard(card.id, card.title, card.description, start, end)
    qc.invalidateQueries({ queryKey: ['card', card.id] })
  }

  return (
    <div>
      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <Calendar className="w-4 h-4" /> 時程
      </Label>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">開始時間</Label>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  value={field.value || null}
                  onChange={(iso) => field.onChange(iso ?? '')}
                />
              )}
            />
          </div>
          <div>
            <Label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">結束時間</Label>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  value={field.value || null}
                  onChange={(iso) => field.onChange(iso ?? '')}
                />
              )}
            />
          </div>
        </div>
        {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2 h-7 text-xs">
          {isSubmitting ? '儲存中...' : '儲存時程'}
        </Button>
      </form>
    </div>
  )
}
