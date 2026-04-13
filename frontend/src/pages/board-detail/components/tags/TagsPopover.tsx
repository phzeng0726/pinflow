import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTagMutations } from '@/hooks/tag/mutations/useTagMutations'
import { useTags } from '@/hooks/tag/queries/useTags'
import { cn } from '@/lib/utils'
import type { Card, Tag } from '@/types'
import { ArrowLeft, Check, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { TAG_COLORS, getTagColorClasses } from './tagColors'

type View =
  | 'list'
  | 'create'
  | { mode: 'edit'; tag: Tag }
  | { mode: 'delete-confirm'; tag: Tag }

interface TagsPopoverProps {
  boardId: number
  card: Card
}

export function TagsPopover(props: TagsPopoverProps) {
  const { boardId, card } = props
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const { data: allTags = [] } = useTags()
  const { createTag, updateTag, deleteTag, attachTag, detachTag } =
    useTagMutations(boardId)

  const cardTagIds = new Set(card.tags?.map((t) => t.id) ?? [])

  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setView('list')
      setSearch('')
    }
  }

  const enterEdit = (tag: Tag) => {
    setEditName(tag.name)
    setEditColor(tag.color)
    setView({ mode: 'edit', tag })
  }

  const enterCreate = () => {
    setEditName('')
    setEditColor('')
    setView('create')
  }

  // ── List View ──────────────────────────────────────────────────────────
  const renderList = () => (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tags
        </span>
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      {/* Tag list */}
      <div className="max-h-48 overflow-y-auto px-3">
        {filteredTags.map((tag) => {
          const attached = cardTagIds.has(tag.id)
          const colorCls = getTagColorClasses(tag.color)
          return (
            <div key={tag.id} className="mb-1 flex items-center gap-2">
              <Checkbox
                checked={attached}
                onCheckedChange={(checked) => {
                  if (checked) {
                    attachTag.mutate({ cardId: card.id, tagId: tag.id })
                  } else {
                    detachTag.mutate({ cardId: card.id, tagId: tag.id })
                  }
                }}
                className="shrink-0"
              />
              <div
                className={cn(
                  'flex flex-1 items-center rounded px-2 py-1.5 text-xs font-medium',
                  tag.color
                    ? `${colorCls.bg} text-white`
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                )}
              >
                {tag.name}
              </div>
              <button
                type="button"
                onClick={() => enterEdit(tag)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-2 dark:border-gray-700">
        <button
          type="button"
          onClick={enterCreate}
          className="w-full text-left text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Create a new tag
        </button>
      </div>
    </div>
  )

  // ── Create / Edit View ─────────────────────────────────────────────────
  const renderCreateEdit = (mode: 'create' | 'edit', tag?: Tag) => {
    const title = mode === 'create' ? 'Create tag' : 'Edit tag'
    const previewCls = editColor
      ? getTagColorClasses(editColor).bg
      : 'bg-gray-200 dark:bg-gray-600'

    const handleSave = async () => {
      if (mode === 'create') {
        await createTag.mutateAsync({ name: editName, color: editColor })
        setView('list')
      } else if (tag) {
        await updateTag.mutateAsync({
          id: tag.id,
          data: { name: editName, color: editColor },
        })
        setView('list')
      }
    }

    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setView('list')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </span>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-3 py-2">
          {/* Color preview bar */}
          <div className={cn('h-8 w-full rounded', previewCls)} />

          {/* Title input */}
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Tag name"
            className="h-7 text-xs"
            autoFocus
          />

          {/* Color grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {TAG_COLORS.map((color) => (
              <button
                key={color.key}
                type="button"
                onClick={() => setEditColor(color.key)}
                className={cn(
                  'flex h-6 items-center justify-center rounded',
                  color.bg,
                  editColor === color.key &&
                    'ring-2 ring-gray-500 ring-offset-1 dark:ring-offset-gray-800',
                )}
              >
                {editColor === color.key && (
                  <Check
                    className={cn(
                      'h-3.5 w-3.5',
                      color.key === '' ||
                        color.key === 'yellow' ||
                        color.key === 'amber'
                        ? 'text-gray-800'
                        : 'text-white',
                    )}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Remove color */}
          <button
            type="button"
            onClick={() => setEditColor('')}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Remove color
          </button>

          {/* Footer buttons */}
          <div className="flex gap-2">
            {mode === 'create' ? (
              <Button
                type="button"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={handleSave}
                disabled={!editName.trim() || createTag.isPending}
              >
                Create
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={handleSave}
                  disabled={!editName.trim() || updateTag.isPending}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    tag && setView({ mode: 'delete-confirm', tag })
                  }
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Delete Confirm View ────────────────────────────────────────────────
  const renderDeleteConfirm = (tag: Tag) => (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Delete tag?
        </span>
        <button
          type="button"
          onClick={() => setView({ mode: 'edit', tag })}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          沒有復原機制，這個 tag 將會從所有的卡片中被移除。
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => setView({ mode: 'edit', tag })}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={async () => {
              await deleteTag.mutateAsync(tag.id)
              setView('list')
            }}
            disabled={deleteTag.isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )

  const renderView = () => {
    if (view === 'list') return renderList()
    if (view === 'create') return renderCreateEdit('create')
    if (typeof view === 'object' && view.mode === 'edit')
      return renderCreateEdit('edit', view.tag)
    if (typeof view === 'object' && view.mode === 'delete-confirm')
      return renderDeleteConfirm(view.tag)
    return null
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {renderView()}
      </PopoverContent>
    </Popover>
  )
}
