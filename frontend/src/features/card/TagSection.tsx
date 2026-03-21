import { zodResolver } from '@hookform/resolvers/zod'
import { Tag as TagIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useTagMutations } from '../../hooks/tag/mutations/useTagMutations'
import { useTags } from '../../hooks/tag/queries/useTags'
import { tagInputSchema } from '../../lib/schemas'
import type { Card } from '../../types'

type TagInputForm = z.infer<typeof tagInputSchema>

export function TagSection({ boardId, card }: { boardId: number; card: Card }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { data: allTags = [] } = useTags()
  const { createTag, attachTag, detachTag } = useTagMutations(boardId)
  const inputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset } = useForm<TagInputForm>({
    resolver: zodResolver(tagInputSchema),
    defaultValues: { input: '' },
  })

  const inputValue = watch('input')

  const cardTagIds = new Set(card.tags?.map(t => t.id) ?? [])
  const filtered = allTags.filter(
    t => !cardTagIds.has(t.id) && t.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleAddTag = async (name: string) => {
    const tag = await createTag.mutateAsync(name)
    await attachTag.mutateAsync({ cardId: card.id, tagId: tag.id })
    reset()
    setShowSuggestions(false)
  }

  const onSubmit = async (data: TagInputForm) => {
    if (data.input.trim()) {
      await handleAddTag(data.input.trim())
    }
  }

  const { ref: rhfRef, ...restRegister } = register('input')

  return (
    <div>
      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        <TagIcon className="w-4 h-4" /> 標籤
      </Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {(card.tags ?? []).map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
          >
            {tag.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-3 w-3 p-0 ml-0.5 hover:text-red-500"
              onClick={() => detachTag.mutate({ cardId: card.id, tagId: tag.id })}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          {...restRegister}
          ref={(el) => { rhfRef(el); (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); handleSubmit(onSubmit)() }
            if (e.key === 'Escape') setShowSuggestions(false)
          }}
          placeholder="新增標籤..."
          className="text-sm h-8"
        />
        {showSuggestions && (inputValue || filtered.length > 0) && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg z-10 overflow-hidden">
            {filtered.slice(0, 6).map(tag => (
              <button
                key={tag.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                onMouseDown={() => { attachTag.mutate({ cardId: card.id, tagId: tag.id }); reset(); setShowSuggestions(false) }}
              >
                {tag.name}
              </button>
            ))}
            {inputValue.trim() && !allTags.find(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 border-t dark:border-gray-600"
                onMouseDown={() => handleAddTag(inputValue.trim())}
              >
                建立「{inputValue.trim()}」
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
