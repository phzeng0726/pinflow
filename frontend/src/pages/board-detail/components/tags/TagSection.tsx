import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Tag as TagIcon, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTagMutations } from '@/hooks/tag/mutations/useTagMutations'
import { useTags } from '@/hooks/tag/queries/useTags'
import { tagInputSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import type { Card, Tag } from '@/types'
import { ColorPicker, getTagColorClasses } from './ColorPicker'

type TagInputForm = z.infer<typeof tagInputSchema>
interface TagFormValues {
  name: string
  color?: string
}

interface TagSectionProps {
  boardId: number
  card: Card
}

export function TagSection(props: TagSectionProps) {
  const { boardId, card } = props

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [newTagColor, setNewTagColor] = useState('')
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const { data: allTags = [] } = useTags()
  const { createTag, updateTag, deleteTag, attachTag, detachTag } =
    useTagMutations(boardId)
  const inputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset } = useForm<TagInputForm>({
    resolver: zodResolver(tagInputSchema),
    defaultValues: { input: '' },
  })

  const editForm = useForm<TagFormValues>()

  const inputValue = watch('input')

  const cardTagIds = new Set(card.tags?.map((t) => t.id) ?? [])
  const filtered = allTags.filter(
    (t) =>
      !cardTagIds.has(t.id) &&
      t.name.toLowerCase().includes(inputValue.toLowerCase()),
  )

  const handleAddTag = async (name: string) => {
    const tag = await createTag.mutateAsync({ name, color: newTagColor })
    await attachTag.mutateAsync({ cardId: card.id, tagId: tag.id })
    reset()
    setNewTagColor('')
    setShowSuggestions(false)
  }

  const onSubmit = async (data: TagInputForm) => {
    if (data.input.trim()) {
      await handleAddTag(data.input.trim())
    }
  }

  const handleDelete = async () => {
    if (!deletingTag) return
    await deleteTag.mutateAsync(deletingTag.id)
    setDeletingTag(null)
  }

  const { ref: rhfRef, ...restRegister } = register('input')

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <TagIcon className="h-4 w-4" /> 標籤
      </Label>
      <div className="mb-3 flex flex-wrap gap-2">
        {(card.tags ?? []).map((tag) => {
          const colorCls = getTagColorClasses(tag.color)
          return (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5',
                tag.color &&
                  `${colorCls.bg} text-white dark:text-white border-transparent`,
              )}
            >
              {tag.name}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'ml-0.5 h-3 w-3 p-0 opacity-60 hover:opacity-100',
                      tag.color ? 'text-white' : '',
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3 p-3" align="start">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      editForm.handleSubmit((data) => {
                        updateTag.mutate({
                          id: tag.id,
                          data: { name: data.name, color: data.color ?? '' },
                        })
                      })()
                    }}
                    className="space-y-3"
                  >
                    <Input
                      defaultValue={tag.name}
                      {...editForm.register('name')}
                      className="h-8 text-sm"
                      placeholder="標籤名稱"
                      autoFocus
                    />
                    <ColorPicker
                      value={editForm.watch('color') ?? tag.color}
                      onChange={(c) => editForm.setValue('color', c)}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="h-7 text-xs">
                        儲存
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-600"
                        onClick={() => setDeletingTag(tag)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        刪除
                      </Button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'ml-0.5 h-3 w-3 p-0',
                  tag.color
                    ? 'text-white hover:text-red-200'
                    : 'hover:text-red-500',
                )}
                onClick={() =>
                  detachTag.mutate({ cardId: card.id, tagId: tag.id })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )
        })}
      </div>
      <div className="relative">
        <Input
          {...restRegister}
          ref={(el) => {
            rhfRef(el)
            ;(inputRef as React.RefObject<HTMLInputElement | null>).current = el
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit(onSubmit)()
            }
            if (e.key === 'Escape') setShowSuggestions(false)
          }}
          placeholder="新增標籤..."
          className="h-8 text-sm"
        />
        {showSuggestions && (inputValue || filtered.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            {filtered.slice(0, 6).map((tag) => {
              const colorCls = getTagColorClasses(tag.color)
              return (
                <button
                  key={tag.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                  onMouseDown={() => {
                    attachTag.mutate({ cardId: card.id, tagId: tag.id })
                    reset()
                    setShowSuggestions(false)
                  }}
                >
                  {tag.color && (
                    <span
                      className={cn('h-3 w-3 rounded-full', colorCls.bg)}
                    />
                  )}
                  {tag.name}
                </button>
              )
            })}
            {inputValue.trim() &&
              !allTags.find(
                (t) => t.name.toLowerCase() === inputValue.toLowerCase(),
              ) && (
                <div className="border-t px-3 py-2 dark:border-gray-600">
                  <div className="mb-2">
                    <ColorPicker
                      value={newTagColor}
                      onChange={setNewTagColor}
                    />
                  </div>
                  <button
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    onMouseDown={() => handleAddTag(inputValue.trim())}
                  >
                    建立「{inputValue.trim()}」
                  </button>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingTag}
        onOpenChange={(open) => {
          if (!open) setDeletingTag(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除標籤</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除標籤「{deletingTag?.name}」嗎？此操作將移除所有卡片上的此標籤。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
