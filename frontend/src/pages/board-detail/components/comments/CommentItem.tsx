import { MarkdownEditor } from '@/components/common/markdown-editor'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatRelativeTime } from '@/lib/dates'
import { useLocaleStore } from '@/stores/localeStore'
import type { Comment } from '@/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CommentItemProps {
  comment: Comment
  onUpdate: (id: number, text: string) => void
  onDelete: (id: number) => void
  isUpdating: boolean
  isDeleting: boolean
}

export function CommentItem(props: CommentItemProps) {
  const { comment, onUpdate, onDelete, isUpdating, isDeleting } = props
  const { t } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleSave = () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    onUpdate(comment.id, trimmed)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditText(comment.text)
    setEditing(false)
  }

  const handleStartEdit = () => {
    setEditText(comment.text)
    setEditing(true)
  }

  const handleCancelDelete = () => {
    setDeleteOpen(false)
  }

  const handleConfirmDelete = () => {
    onDelete(comment.id)
    setDeleteOpen(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const relativeTime = formatRelativeTime(comment.createdAt, locale)

  return (
    <div className="rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      {editing ? (
        <div className="space-y-2">
          <MarkdownEditor
            value={editText}
            onChange={setEditText}
            onBlur={handleCancel}
            defaultEditing
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onMouseDown={handleMouseDown}
              onClick={handleSave}
              disabled={isUpdating || !editText.trim()}
            >
              {t('comment.save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              {t('comment.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {comment.text}
          </ReactMarkdown>
        </div>
      )}

      {!editing && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <span>{relativeTime}</span>
          <span>•</span>
          <button
            type="button"
            className="hover:text-gray-600 dark:hover:text-gray-200"
            onClick={handleStartEdit}
          >
            {t('comment.edit')}
          </button>
          <span>•</span>
          <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="hover:text-red-500">
                {t('comment.delete')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" side="top">
              <p className="mb-3 text-xs font-medium">
                {t('comment.deleteConfirmTitle')}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelDelete}
                >
                  {t('comment.cancel')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                >
                  {t('comment.delete')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
