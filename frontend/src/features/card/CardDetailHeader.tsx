import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { cardDetailSchema } from '../../lib/schemas'
import type { Card } from '../../types'

type CardDetailForm = z.infer<typeof cardDetailSchema>

interface CardDetailHeaderProps {
  boardId: number
  card: Card
  onClose: () => void
}

export function CardDetailHeader({ boardId, card, onClose }: CardDetailHeaderProps) {
  const { updateCard } = useCardMutations(boardId)

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, reset } = useForm<CardDetailForm>({
    resolver: zodResolver(cardDetailSchema),
    defaultValues: { title: card.title, desc: card.description },
  })

  const onSubmit = async (data: CardDetailForm) => {
    await updateCard.mutateAsync({
      id: card.id, title: data.title, description: data.desc ?? '',
      startTime: card.start_time, endTime: card.end_time,
    })
    reset(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3 p-6 border-b dark:border-gray-700">
      <div className="flex-1 space-y-2">
        <Input
          {...register('title')}
          className="w-full text-xl font-semibold border-transparent shadow-none focus-visible:ring-1 px-1 bg-transparent"
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        <Textarea
          {...register('desc')}
          placeholder="Add a description..."
          rows={10}
          className="w-full text-sm border-transparent shadow-none focus-visible:ring-1 px-1 bg-transparent resize-none text-gray-600 dark:text-gray-400"
        />
        {isDirty && (
          <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs flex items-center gap-1">
            <Save className="w-3 h-3" />
            {isSubmitting ? '儲存中...' : '儲存'}
          </Button>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="mt-1 h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X className="w-5 h-5" />
      </Button>
    </form>
  )
}
