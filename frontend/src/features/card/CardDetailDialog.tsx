import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Tag as TagIcon, Calendar, CheckSquare, Trash2, Plus, Check } from 'lucide-react'
import { getCard, updateCard } from '../../lib/api'
import { useTags, useCreateTag, useAttachTag, useDetachTag } from '../../hooks/useTags'
import {
  useCreateChecklist,
  useCreateChecklistItem,
  useDeleteChecklist,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from '../../hooks/useChecklists'
import type { Card } from '../../types'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface CardDetailDialogProps {
  cardId: number
  onClose: () => void
}

export function CardDetailDialog({ cardId, onClose }: CardDetailDialogProps) {
  const qc = useQueryClient()
  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => getCard(cardId),
  })

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (isLoading || !card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader card={card} onClose={onClose} qc={qc} />
        <div className="p-6 space-y-6">
          <TagSection card={card} />
          <ScheduleSection card={card} qc={qc} />
          <ChecklistSection card={card} />
        </div>
      </div>
    </div>
  )
}

// --- Header: title, description, close ---
function DialogHeader({ card, onClose, qc }: { card: Card; onClose: () => void; qc: ReturnType<typeof useQueryClient> }) {
  const [title, setTitle] = useState(card.title)
  const [desc, setDesc] = useState(card.description)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateCard(card.id, title.trim(), desc, card.start_time, card.end_time)
      qc.invalidateQueries({ queryKey: ['card', card.id] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start gap-3 p-6 border-b dark:border-gray-700">
      <div className="flex-1 space-y-2">
        <input
          className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 text-gray-900 dark:text-gray-100"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
        />
        <textarea
          className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 resize-none"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={handleSave}
          placeholder="Add a description..."
          rows={2}
        />
        {saving && <span className="text-xs text-gray-400">Saving...</span>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-1">
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// --- Tag section ---
function TagSection({ card }: { card: Card }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { data: allTags = [] } = useTags()
  const createTag = useCreateTag()
  const attachTag = useAttachTag(card.id)
  const detachTag = useDetachTag(card.id)
  const inputRef = useRef<HTMLInputElement>(null)

  const cardTagIds = new Set(card.tags?.map(t => t.id) ?? [])
  const filtered = allTags.filter(
    t => !cardTagIds.has(t.id) && t.name.toLowerCase().includes(input.toLowerCase())
  )

  const handleAddTag = async (name: string) => {
    const tag = await createTag.mutateAsync(name)
    await attachTag.mutateAsync(tag.id)
    setInput('')
    setShowSuggestions(false)
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      await handleAddTag(input.trim())
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <TagIcon className="w-4 h-4" /> 標籤
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {(card.tags ?? []).map(tag => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs"
          >
            {tag.name}
            <button
              onClick={() => detachTag.mutate(tag.id)}
              className="hover:text-red-500 ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="新增標籤..."
          className="text-sm h-8"
        />
        {showSuggestions && (input || filtered.length > 0) && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg z-10 overflow-hidden">
            {filtered.slice(0, 6).map(tag => (
              <button
                key={tag.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                onMouseDown={() => { attachTag.mutate(tag.id); setInput(''); setShowSuggestions(false) }}
              >
                {tag.name}
              </button>
            ))}
            {input.trim() && !allTags.find(t => t.name.toLowerCase() === input.toLowerCase()) && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 border-t dark:border-gray-600"
                onMouseDown={() => handleAddTag(input.trim())}
              >
                建立「{input.trim()}」
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Schedule section ---
function ScheduleSection({ card, qc }: { card: Card; qc: ReturnType<typeof useQueryClient> }) {
  const [startTime, setStartTime] = useState(card.start_time ? card.start_time.slice(0, 16) : '')
  const [endTime, setEndTime] = useState(card.end_time ? card.end_time.slice(0, 16) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setError('')
    const start = startTime ? new Date(startTime).toISOString() : null
    const end = endTime ? new Date(endTime).toISOString() : null
    if (start && end && end < start) {
      setError('結束時間必須晚於開始時間')
      return
    }
    setSaving(true)
    try {
      await updateCard(card.id, card.title, card.description, start, end)
      qc.invalidateQueries({ queryKey: ['card', card.id] })
    } catch {
      setError('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <Calendar className="w-4 h-4" /> 時程
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">開始時間</label>
          <input
            type="datetime-local"
            className="w-full text-sm border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">結束時間</label>
          <input
            type="datetime-local"
            className="w-full text-sm border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <Button onClick={handleSave} disabled={saving} className="mt-2 h-7 text-xs">
        {saving ? '儲存中...' : '儲存時程'}
      </Button>
    </div>
  )
}

// --- Checklist section ---
function ChecklistSection({ card }: { card: Card }) {
  const [newTitle, setNewTitle] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const createChecklist = useCreateChecklist(card.id)

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    await createChecklist.mutateAsync(newTitle.trim())
    setNewTitle('')
    setShowNewForm(false)
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <CheckSquare className="w-4 h-4" /> 檢查清單
      </h3>
      <div className="space-y-4">
        {(card.checklists ?? []).map(cl => (
          <ChecklistBlock key={cl.id} checklist={cl} cardId={card.id} />
        ))}
      </div>
      {showNewForm ? (
        <div className="mt-3 flex gap-2">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewForm(false) }}
            placeholder="清單名稱..."
            className="text-sm h-8"
            autoFocus
          />
          <Button onClick={handleCreate} className="h-8 text-xs">新增</Button>
          <Button variant="ghost" onClick={() => setShowNewForm(false)} className="h-8 text-xs">取消</Button>
        </div>
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

function ChecklistBlock({ checklist, cardId }: { checklist: import('../../types').Checklist; cardId: number }) {
  const [newItemText, setNewItemText] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const deleteChecklist = useDeleteChecklist(cardId)
  const createItem = useCreateChecklistItem(cardId)
  const updateItem = useUpdateChecklistItem(cardId)
  const deleteItem = useDeleteChecklistItem(cardId)

  const completedCount = checklist.items?.filter(i => i.completed).length ?? 0
  const total = checklist.items?.length ?? 0
  const progress = total > 0 ? (completedCount / total) * 100 : 0

  const handleAddItem = async () => {
    if (!newItemText.trim()) return
    await createItem.mutateAsync({ checklistId: checklist.id, text: newItemText.trim() })
    setNewItemText('')
    setShowItemForm(false)
  }

  const handleEditSave = async (itemId: number) => {
    if (!editText.trim()) return
    await updateItem.mutateAsync({ id: itemId, data: { text: editText.trim() } })
    setEditingItemId(null)
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{checklist.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{completedCount}/{total}</span>
          <button
            onClick={() => deleteChecklist.mutate(checklist.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {total > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-3">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="space-y-1.5">
        {(checklist.items ?? []).map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={e => updateItem.mutate({ id: item.id, data: { completed: e.target.checked } })}
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
            {editingItemId === item.id ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                  className="text-sm h-7 flex-1"
                  autoFocus
                />
                <button onClick={() => handleEditSave(item.id)} className="text-green-500">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span
                className={cn(
                  'flex-1 text-sm cursor-pointer',
                  item.completed
                    ? 'line-through text-gray-400 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300',
                )}
                onClick={() => { setEditingItemId(item.id); setEditText(item.text) }}
              >
                {item.text}
              </span>
            )}
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {showItemForm ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setShowItemForm(false) }}
            placeholder="新增項目..."
            className="text-sm h-7 flex-1"
            autoFocus
          />
          <Button onClick={handleAddItem} className="h-7 text-xs">新增</Button>
          <Button variant="ghost" onClick={() => setShowItemForm(false)} className="h-7 text-xs">取消</Button>
        </div>
      ) : (
        <button
          onClick={() => setShowItemForm(true)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Plus className="w-3 h-3" /> 新增項目
        </button>
      )}
    </div>
  )
}
