import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCommentMutations } from '@/hooks/comment/mutations/useCommentMutations'
import { useLocaleStore } from '@/stores/localeStore'
import type { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { enUS, zhTW } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CommentSectionProps {
  cardId: number
  boardId: number
  comments: Comment[]
}

interface CommentItemProps {
  comment: Comment
  onUpdate: (id: number, text: string) => void
  onDelete: (id: number) => void
  isUpdating: boolean
  isDeleting: boolean
}

function CommentItem({
  comment,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: CommentItemProps) {
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

  const dateFnsLocale = locale === 'zh-TW' ? zhTW : enUS
  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: dateFnsLocale,
  })

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
              onMouseDown={(e) => e.preventDefault()}
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
            onClick={() => {
              setEditText(comment.text)
              setEditing(true)
            }}
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => {
                    onDelete(comment.id)
                    setDeleteOpen(false)
                  }}
                >
                  {t('comment.confirmDelete')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteOpen(false)}
                >
                  {t('comment.cancel')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}

export function CommentSection({
  cardId,
  boardId,
  comments,
}: CommentSectionProps) {
  const { t } = useTranslation()
  const [newText, setNewText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const { create, update, remove } = useCommentMutations(cardId, boardId)

  const handleOpen = () => {
    setIsEditing(true)
  }

  const handleCreate = async () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    try {
      await create.mutateAsync(trimmed)
      setNewText('')
      setIsEditing(false)
    } catch {
      // error toast handled by mutation's onError
    }
  }

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="flex h-full flex-col">
      {/* 頂部標題 */}
      <div className="flex items-center gap-2 border-b px-4 py-3 dark:border-gray-700">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('comment.title')}
        </span>
        {comments.length > 0 && (
          <span className="text-xs text-gray-400">({comments.length})</span>
        )}
      </div>

      {/* 輸入區 */}
      <div className="p-3">
        {isEditing ? (
          <>
            <MarkdownEditor
              value={newText}
              onChange={setNewText}
              onBlur={() => setIsEditing(false)}
              placeholder={t('comment.writePlaceholder')}
              defaultEditing
            />
            <Button
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={create.isPending || !newText.trim()}
            >
              {t('comment.save')}
            </Button>
          </>
        ) : (
          <div
            onClick={handleOpen}
            className="w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t('comment.writePlaceholder')}
          </div>
        )}
      </div>

      {/* 留言列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sorted.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            {t('comment.noComments')}
          </p>
        )}
        {sorted.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onUpdate={(id, text) => update.mutate({ id, text })}
            onDelete={(id) => remove.mutate(id)}
            isUpdating={update.isPending}
            isDeleting={remove.isPending}
          />
        ))}
      </div>
    </div>
  )
}
