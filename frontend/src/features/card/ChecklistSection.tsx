import { useState } from 'react'
import { CheckSquare, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useChecklistMutations } from '../../hooks/checklist/mutations/useChecklistMutations'
import { checklistSchema } from '../../lib/schemas'
import type { Card } from '../../types'
import type { z } from 'zod'
import { ChecklistBlock } from './ChecklistBlock'

type ChecklistForm = z.infer<typeof checklistSchema>

export function ChecklistSection({ card }: { card: Card }) {
  const [showNewForm, setShowNewForm] = useState(false)
  const { createChecklist } = useChecklistMutations(card.id)

  const { register, handleSubmit, reset } = useForm<ChecklistForm>({
    resolver: zodResolver(checklistSchema),
  })

  const onSubmit = async (data: ChecklistForm) => {
    await createChecklist.mutateAsync(data.title)
    reset()
    setShowNewForm(false)
  }

  return (
    <div>
      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <CheckSquare className="w-4 h-4" /> 檢查清單
      </Label>
      <div className="space-y-4">
        {(card.checklists ?? []).map(cl => (
          <ChecklistBlock key={cl.id} checklist={cl} cardId={card.id} />
        ))}
      </div>
      {showNewForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 flex gap-2">
          <Input
            {...register('title')}
            onKeyDown={e => { if (e.key === 'Escape') { reset(); setShowNewForm(false) } }}
            placeholder="清單名稱..."
            className="text-sm h-8"
            autoFocus
          />
          <Button type="submit" className="h-8 text-xs">新增</Button>
          <Button type="button" variant="ghost" onClick={() => { reset(); setShowNewForm(false) }} className="h-8 text-xs">取消</Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowNewForm(true)}
          className="mt-3 h-8 text-xs text-gray-500"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> 新增清單
        </Button>
      )}
    </div>
  )
}
