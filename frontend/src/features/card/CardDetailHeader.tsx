import { type EditCardForm, editCardSchema } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import type { Card } from '../../types'

interface CardDetailHeaderProps {
  boardId: number
  card: Card
  onClose: () => void
}

export function CardDetailHeader(props: CardDetailHeaderProps) {
  const { boardId, card, onClose } = props

  const { updateCard } = useCardMutations(boardId)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<EditCardForm>({
    resolver: zodResolver(editCardSchema),
    defaultValues: { title: card.title, description: card.description },
  })

  const onSubmit = async (form: EditCardForm) => {
    await updateCard.mutateAsync({
      id: card.id,
      form: {
        title: form.title,
        description: form.description,
        storyPoint: card.storyPoint ?? undefined,
        startTime: card.startTime ?? undefined,
        endTime: card.endTime ?? undefined,
      },
    })
    reset(form)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-start gap-3 border-b p-6 dark:border-gray-700"
    >
      <div className="flex-1 space-y-2">
        <Input
          {...register('title')}
          className="w-full border-transparent bg-transparent px-1 text-xl font-semibold shadow-none focus-visible:ring-1"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
        <Textarea
          {...register('description')}
          placeholder="Add a description..."
          rows={10}
          className="w-full resize-none border-transparent bg-transparent px-1 text-sm text-gray-600 shadow-none focus-visible:ring-1 dark:text-gray-400"
        />
        {isDirty && (
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="flex h-7 items-center gap-1 text-xs"
          >
            <Save className="h-3 w-3" />
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
        <X className="h-5 w-5" />
      </Button>
    </form>
  )
}
