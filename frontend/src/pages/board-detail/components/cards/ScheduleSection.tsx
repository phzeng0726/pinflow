import { type EditCardForm, editCardSchema } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import type { Card } from '@/types'

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
    formState: { errors },
  } = useForm<EditCardForm>({
    resolver: zodResolver(editCardSchema),
    defaultValues: {
      startTime: card.startTime ?? '',
      endTime: card.endTime ?? '',
    },
  })

  const onSubmit = async (data: EditCardForm) => {
    await updateCard.mutateAsync({
      id: card.id,
      form: {
        startTime: data.startTime,
        endTime: data.endTime,
      },
    })
  }

  // 封裝一個 blur 處理函數
  const handleBlur = () => {
    handleSubmit(onSubmit)()
  }

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Calendar className="h-4 w-4" /> 時程
      </Label>
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
                onClose={handleBlur}
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
                onClose={handleBlur}
              />
            )}
          />
        </div>
      </div>
      {errors.endTime && (
        <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
      )}
    </div>
  )
}
