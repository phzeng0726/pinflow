import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cardSchema } from '../../lib/schemas'
import type { z } from 'zod'

type CardForm = z.infer<typeof cardSchema>

interface AddCardFormProps {
  onAdd: (title: string, description: string) => void
}

export function AddCardForm({ onAdd }: AddCardFormProps) {
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
  })

  const onSubmit = (data: CardForm) => {
    onAdd(data.title, data.description ?? '')
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-1 transition-colors"
      >
        <Plus className="w-4 h-4" />
        新增卡片
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Input
        {...register('title')}
        placeholder="卡片標題"
        autoFocus
        className="text-sm"
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-7 text-xs">新增</Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => { reset(); setOpen(false) }} className="h-7 w-7">
          <X className="w-3 h-3" />
        </Button>
      </div>
    </form>
  )
}
