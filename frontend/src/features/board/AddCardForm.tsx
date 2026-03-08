import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface AddCardFormProps {
  onAdd: (title: string, description: string) => void
}

export function AddCardForm({ onAdd }: AddCardFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd(title.trim(), description.trim())
    setTitle('')
    setDescription('')
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
    <div className="space-y-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="卡片標題"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        autoFocus
        className="text-sm"
      />
      <div className="flex gap-1">
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()} className="h-7 text-xs">新增</Button>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="h-7 w-7">
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
