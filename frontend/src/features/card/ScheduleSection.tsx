import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../../components/ui/button'
import { DateTimePicker } from '../../components/ui/date-time-picker'
import { Label } from '../../components/ui/label'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { scheduleSchema } from '../../lib/schemas'
import type { Card } from '../../types'

type ScheduleForm = z.infer<typeof scheduleSchema>

interface ScheduleSectionProps {
  boardId: number
  card: Card
}

export function ScheduleSection(props: ScheduleSectionProps) {
  const { boardId, card } = props

  const { updateCard } = useCardMutations(boardId)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      startTime: card.startTime ?? '',
      endTime: card.endTime ?? '',
    },
  })

  const onSubmit = async (data: ScheduleForm) => {
    await updateCard.mutateAsync({
      id: card.id,
      title: card.title,
      description: card.description,
      storyPoint: card.storyPoint,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
    })
    // 儲存後重設 dirty 狀態，讓按鈕隱藏
    reset({ startTime: data.startTime, endTime: data.endTime })
  }

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Calendar className="h-4 w-4" /> 時程
      </Label>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              開始時間
            </Label>
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
            <Label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              結束時間
            </Label>
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
        {errors.endTime && (
          <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
        )}
        {/* 有修改才顯示 */}
        {isDirty && (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-7 text-xs"
          >
            {isSubmitting ? '儲存中...' : '儲存時程'}
          </Button>
        )}
      </form>
    </div>
  )
}
