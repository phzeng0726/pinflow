import { MarkdownEditor } from '@/components/common/markdown-editor'
import { Button } from '@/components/ui/button'
import { useCommentMutations } from '@/hooks/comment/mutations/useCommentMutations'
import type { Comment } from '@/types'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommentItem } from './CommentItem'

interface CommentSectionProps {
  cardId: number
  boardId: number
  comments: Comment[]
}

export function CommentSection(props: CommentSectionProps) {
  const { cardId, boardId, comments } = props

  const { t } = useTranslation()
  const [newText, setNewText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const { create, update, remove } = useCommentMutations(cardId, boardId)

  const handleOpen = () => {
    setIsEditing(true)
  }

  const handleEditorBlur = () => {
    setIsEditing(false)
  }

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleCreate = () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    create.mutate(trimmed, {
      onSuccess: () => {
        setNewText('')
        setIsEditing(false)
      },
    })
  }

  const handleUpdateComment = (id: number, text: string) => {
    update.mutate({ id, text })
  }

  const handleDeleteComment = (id: number) => {
    remove.mutate(id)
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
          <div className="space-y-2">
            <MarkdownEditor
              value={newText}
              onChange={setNewText}
              onBlur={handleEditorBlur}
              placeholder={t('comment.writePlaceholder')}
              defaultEditing
              cardId={cardId}
            />
            <Button
              size="sm"
              onMouseDown={handleButtonMouseDown}
              onClick={handleCreate}
              disabled={create.isPending || !newText.trim()}
            >
              {t('comment.save')}
            </Button>
          </div>
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
            cardId={cardId}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
            isUpdating={update.isPending}
            isDeleting={remove.isPending}
          />
        ))}
      </div>
    </div>
  )
}
