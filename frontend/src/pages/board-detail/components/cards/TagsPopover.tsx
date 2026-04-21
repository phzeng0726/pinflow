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
import { createTagSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import {
  TAG_COLORS,
  getTagColorClasses,
} from '@/lib/styleConfig'
import type { Card, Tag } from '@/types'
import { ArrowLeft, Check, Pencil, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type View =
  | 'list'
  | 'create'
  | { mode: 'edit'; tag: Tag }
  | { mode: 'delete-confirm'; tag: Tag }

interface TagsPopoverProps {
  boardId: number
  card: Card
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TagsPopover(props: TagsPopoverProps) {
  const {
    boardId,
    card,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
  } = props
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const { t } = useTranslation()
  const tagSchema = useMemo(() => createTagSchema(t), [t])
  const { data: allTags = [] } = useTags()
  const { createTag, updateTag, deleteTag, attachTag, detachTag } =
    useTagMutations(boardId)

  const cardTagIds = new Set(card.tags?.map((tg) => tg.id) ?? [])

  const filteredTags = allTags.filter((tg) =>
    tg.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenChange = (isOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(isOpen)
    } else {
      setInternalOpen(isOpen)
    }
    if (!isOpen) {
      setView('list')
      setSearch('')
    }
  }

  const handleClose = () => handleOpenChange(false)

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

  const handleSave = (mode: 'create' | 'edit', tag?: Tag) => {
    if (mode === 'create') {
      createTag.mutate(
        { name: editName, color: editColor },
        { onSuccess: () => setView('list') },
      )
    } else if (tag) {
      updateTag.mutate(
        { id: tag.id, data: { name: editName, color: editColor } },
        { onSuccess: () => setView('list') },
      )
    }
  }

  const handleDelete = (tag: Tag) => {
    deleteTag.mutate(tag.id, { onSuccess: () => setView('list') })
  }

  const handleBackToList = () => setView('list')
  const handleCreateSave = () => handleSave('create')

  const renderView = () => {
    if (view === 'list') {
      return (
        <TagListView
          search={search}
          onSearchChange={setSearch}
          filteredTags={filteredTags}
          cardTagIds={cardTagIds}
          card={card}
          attachTag={attachTag}
          detachTag={detachTag}
          onClose={handleClose}
          onEnterEdit={enterEdit}
          onEnterCreate={enterCreate}
        />
      )
    }
    if (view === 'create') {
      return (
        <TagCreateEditView
          mode="create"
          editName={editName}
          editColor={editColor}
          onEditNameChange={setEditName}
          onEditColorChange={setEditColor}
          onBack={handleBackToList}
          onClose={handleClose}
          onSave={handleCreateSave}
          onShowDeleteConfirm={undefined}
          isSavePending={createTag.isPending}
          isValid={tagSchema.safeParse({ name: editName, color: editColor }).success}
        />
      )
    }
    if (typeof view === 'object' && view.mode === 'edit') {
      const tag = view.tag
      const handleEditSave = () => handleSave('edit', tag)
      const handleShowDeleteConfirm = () => setView({ mode: 'delete-confirm', tag })
      return (
        <TagCreateEditView
          mode="edit"
          tag={tag}
          editName={editName}
          editColor={editColor}
          onEditNameChange={setEditName}
          onEditColorChange={setEditColor}
          onBack={handleBackToList}
          onClose={handleClose}
          onSave={handleEditSave}
          onShowDeleteConfirm={handleShowDeleteConfirm}
          isSavePending={updateTag.isPending}
          isValid={tagSchema.safeParse({ name: editName, color: editColor }).success}
        />
      )
    }
    if (typeof view === 'object' && view.mode === 'delete-confirm') {
      const tag = view.tag
      const handleBackToEdit = () => setView({ mode: 'edit', tag })
      const handleConfirmDelete = () => handleDelete(tag)
      return (
        <TagDeleteConfirmView
          tag={tag}
          onBack={handleBackToEdit}
          onDelete={handleConfirmDelete}
          isDeleting={deleteTag.isPending}
        />
      )
    }
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

// ─── TagListView ──────────────────────────────────────────────────────────────

interface TagListViewProps {
  search: string
  onSearchChange: (v: string) => void
  filteredTags: Tag[]
  cardTagIds: Set<number>
  card: Card
  attachTag: ReturnType<typeof useTagMutations>['attachTag']
  detachTag: ReturnType<typeof useTagMutations>['detachTag']
  onClose: () => void
  onEnterEdit: (tag: Tag) => void
  onEnterCreate: () => void
}

function TagListView(props: TagListViewProps) {
  const {
    search,
    onSearchChange,
    filteredTags,
    cardTagIds,
    card,
    attachTag,
    detachTag,
    onClose,
    onEnterEdit,
    onEnterCreate,
  } = props
  const { t } = useTranslation()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('tags.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder={t('tags.searchPlaceholder')}
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      {/* Tag list */}
      <div className="max-h-48 overflow-y-auto px-3">
        {filteredTags.map((tag) => {
          const attached = cardTagIds.has(tag.id)
          const colorCls = getTagColorClasses(tag.color)

          const toggleTag = (next?: boolean) => {
            const shouldAttach = next ?? !attached
            const fn = shouldAttach ? attachTag : detachTag
            fn.mutate({ cardId: card.id, tagId: tag.id })
          }

          const handleCheckboxChange = (checked: boolean | 'indeterminate') =>
            toggleTag(checked === true)
          const handleTagClick = () => toggleTag()
          const handleEditClick = () => onEnterEdit(tag)

          return (
            <div key={tag.id} className="mb-1 flex items-center gap-2">
              <Checkbox
                checked={attached}
                onCheckedChange={handleCheckboxChange}
                className="shrink-0"
              />
              <div
                className={cn(
                  'flex flex-1 items-center rounded px-2 py-1.5 text-xs font-medium',
                  tag.color
                    ? `${colorCls.bg} text-white`
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                  'cursor-pointer',
                )}
                onClick={handleTagClick}
              >
                {tag.name}
              </div>
              <button
                type="button"
                onClick={handleEditClick}
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
          onClick={onEnterCreate}
          className="w-full text-left text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {t('tags.createNew')}
        </button>
      </div>
    </div>
  )
}

// ─── TagCreateEditView ────────────────────────────────────────────────────────

interface TagCreateEditViewProps {
  mode: 'create' | 'edit'
  tag?: Tag
  editName: string
  editColor: string
  onEditNameChange: (v: string) => void
  onEditColorChange: (v: string) => void
  onBack: () => void
  onClose: () => void
  onSave: () => void
  onShowDeleteConfirm: (() => void) | undefined
  isSavePending: boolean
  isValid: boolean
}

function TagCreateEditView(props: TagCreateEditViewProps) {
  const {
    mode,
    editName,
    editColor,
    onEditNameChange,
    onEditColorChange,
    onBack,
    onClose,
    onSave,
    onShowDeleteConfirm,
    isSavePending,
    isValid,
  } = props
  const { t } = useTranslation()

  const title = mode === 'create' ? t('tags.createTitle') : t('tags.editTitle')
  const previewCls = editColor
    ? getTagColorClasses(editColor).bg
    : 'bg-gray-200 dark:bg-gray-600'

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditNameChange(e.target.value)
  }

  const handleRemoveColor = () => {
    onEditColorChange('')
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
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
          onChange={handleNameChange}
          placeholder={t('tags.namePlaceholder')}
          className="h-7 text-xs"
          autoFocus
        />

        {/* Color grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {TAG_COLORS.map((color) => {
            const handleColorSelect = () => onEditColorChange(color.key)
            return (
              <button
                key={color.key}
                type="button"
                onClick={handleColorSelect}
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
            )
          })}
        </div>

        {/* Remove color */}
        <button
          type="button"
          onClick={handleRemoveColor}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {t('tags.removeColor')}
        </button>

        {/* Footer buttons */}
        <div className="flex gap-2">
          {mode === 'create' ? (
            <Button
              type="button"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={onSave}
              disabled={!isValid || isSavePending}
            >
              {t('tags.create')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={onSave}
                disabled={!isValid || isSavePending}
              >
                {t('tags.save')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={onShowDeleteConfirm}
              >
                {t('tags.delete')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TagDeleteConfirmView ─────────────────────────────────────────────────────

interface TagDeleteConfirmViewProps {
  tag: Tag
  onBack: () => void
  onDelete: () => void
  isDeleting: boolean
}

function TagDeleteConfirmView(props: TagDeleteConfirmViewProps) {
  const { onBack, onDelete, isDeleting } = props
  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('tags.deleteTitle')}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {t('tags.deleteDesc')}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={onBack}
          >
            {t('tags.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {t('tags.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}
