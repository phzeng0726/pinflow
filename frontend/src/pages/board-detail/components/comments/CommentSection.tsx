import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useCommentMutations } from '@/hooks/comment/mutations/useCommentMutations'
import type { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

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

  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  })

  return (
    <div className="rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating || !editText.trim()}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
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
            Edit
          </button>
          <span>•</span>
          <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="hover:text-red-500"
              >
                Delete
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" side="top">
              <p className="mb-3 text-xs font-medium">確定要刪除這則留言？</p>
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
                  確認刪除
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteOpen(false)}
                >
                  取消
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
  const [newText, setNewText] = useState('')
  const { create, update, remove } = useCommentMutations(cardId, boardId)

  const handleCreate = () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    create.mutate(trimmed, { onSuccess: () => setNewText('') })
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
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-xs text-gray-400">({comments.length})</span>
        )}
      </div>

      {/* 輸入區 */}
      <div className="border-b p-3 dark:border-gray-700">
        <Textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="mb-2 resize-none text-sm"
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={create.isPending || !newText.trim()}
        >
          Save
        </Button>
      </div>

      {/* 留言列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sorted.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            尚無留言
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
