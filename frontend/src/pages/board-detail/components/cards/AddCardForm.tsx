import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createCardSchema, type NewCardForm } from '@/lib/schemas'

interface AddCardFormProps {
  boardId: number
  columnId: number
}

export function AddCardForm(props: AddCardFormProps) {
  const { boardId, columnId } = props

  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const cardSchema = useMemo(() => createCardSchema(t), [t])

  const { createCard } = useCardMutations(boardId)

  const { register, handleSubmit, reset, control } = useForm<NewCardForm>({
    resolver: zodResolver(cardSchema),
  })

  const titleValue = useWatch({ control, name: 'title' })

  const handleOpen = () => setOpen(true)

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  const onSubmit = useCallback(
    (form: NewCardForm) => {
      createCard.mutate({ columnId, form })
      reset()
      setOpen(false)
    },
    [columnId, createCard, reset],
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) {
        if (titleValue?.trim()) {
          handleSubmit(onSubmit)()
        } else {
          reset()
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [handleSubmit, onSubmit, open, reset, titleValue])

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        <Plus className="h-4 w-4" />
        {t('card.addCard')}
      </button>
    )
  }

  return (
    <div ref={formRef}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <Textarea
          {...register('title')}
          placeholder={t('card.titlePlaceholder')}
          autoFocus
          className="resize-none text-sm"
          rows={3}
        />
        <div className="flex gap-1">
          <Button type="submit" size="sm" className="h-7 text-xs">
            {t('card.add')}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  )
}
