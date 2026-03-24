import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { cardSchema } from '../../lib/schemas'

type CardForm = z.infer<typeof cardSchema>

interface AddCardFormProps {
  boardId: number
  columnId: number
}

export function AddCardForm(props: AddCardFormProps) {
  const { boardId, columnId } = props

  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const { createCard } = useCardMutations(boardId)

  const { register, handleSubmit, reset, watch } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
  })

  const titleValue = watch('title')

  const onSubmit = (data: CardForm) => {
    createCard.mutate({
      columnId: columnId,
      title: data.title,
      description: data.description ?? '',
    })
    reset()
    setOpen(false)
  }

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
  }, [open, titleValue])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        <Plus className="h-4 w-4" />
        新增卡片
      </button>
    )
  }

  return (
    <div ref={formRef}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <Textarea
          {...register('title')}
          placeholder="卡片標題"
          autoFocus
          className="resize-none text-sm"
          rows={3}
        />
        <div className="flex gap-1">
          <Button type="submit" size="sm" className="h-7 text-xs">
            新增
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              reset()
              setOpen(false)
            }}
            className="h-7 w-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  )
}
