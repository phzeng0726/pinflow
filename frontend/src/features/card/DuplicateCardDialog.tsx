import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useBoards, useBoard } from '../../hooks/board/queries/useBoards'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import type { Card } from '../../types'

interface DuplicateCardDialogProps {
  card: Card
  boardId: number
  onClose: () => void
}

export function DuplicateCardDialog({ card, boardId, onClose }: DuplicateCardDialogProps) {
  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.start_time || !!card.end_time

  const [title, setTitle] = useState(card.title)
  const [copyTags, setCopyTags] = useState(true)
  const [copyChecklists, setCopyChecklists] = useState(true)
  const [copySchedule, setCopySchedule] = useState(true)
  const [selectedBoardId, setSelectedBoardId] = useState(boardId)
  const [selectedColumnId, setSelectedColumnId] = useState(card.column_id)
  const [positionIndex, setPositionIndex] = useState(0)

  const { data: boards = [] } = useBoards()
  const { data: selectedBoard } = useBoard(selectedBoardId)
  const { duplicateCard: duplicate } = useCardMutations()

  const columns = selectedBoard?.columns ?? []
  const targetColumn = columns.find(c => c.id === selectedColumnId)
  const targetCards = targetColumn?.cards ?? []
  const positionCount = targetCards.length + 1

  const handleBoardChange = (newBoardId: number) => {
    setSelectedBoardId(newBoardId)
    // Reset column to first column of new board
    const newBoard = boards.find(b => b.id === newBoardId)
    const firstCol = newBoard?.columns?.[0]
    setSelectedColumnId(firstCol?.id ?? 0)
    setPositionIndex(0)
  }

  const handleColumnChange = (newColId: number) => {
    setSelectedColumnId(newColId)
    setPositionIndex(0)
  }

  const handleSubmit = () => {
    if (!title.trim() || !selectedColumnId) return
    duplicate.mutate(
      {
        id: card.id,
        data: {
          title: title.trim(),
          target_column_id: selectedColumnId,
          position_index: positionIndex,
          copy_tags: copyTags,
          copy_checklists: copyChecklists,
          copy_schedule: copySchedule,
        },
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-80 p-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">複製卡片</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">名稱</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-sm"
            autoFocus
          />
        </div>

        {/* Copy options */}
        {(tags.length > 0 || checklists.length > 0 || hasSchedule) && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">保留...</p>
            <div className="space-y-1.5">
              {tags.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyTags}
                    onChange={e => setCopyTags(e.target.checked)}
                    className="rounded"
                  />
                  標籤 ({tags.length})
                </label>
              )}
              {checklists.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyChecklists}
                    onChange={e => setCopyChecklists(e.target.checked)}
                    className="rounded"
                  />
                  清單 ({checklists.length})
                </label>
              )}
              {hasSchedule && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copySchedule}
                    onChange={e => setCopySchedule(e.target.checked)}
                    className="rounded"
                  />
                  時程
                </label>
              )}
            </div>
          </div>
        )}

        {/* Destination */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">複製到...</p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">面板</label>
              <select
                value={selectedBoardId}
                onChange={e => handleBoardChange(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">列表</label>
                <select
                  value={selectedColumnId}
                  onChange={e => handleColumnChange(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs text-gray-400 mb-1">位置</label>
                <select
                  value={positionIndex}
                  onChange={e => setPositionIndex(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Array.from({ length: positionCount }, (_, i) => {
                    const val = i + 1
                    const isLast = val === positionCount
                    return (
                      <option key={val} value={isLast ? 0 : val}>
                        {isLast ? '末尾' : String(val)}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!title.trim() || !selectedColumnId || duplicate.isPending}
        >
          {duplicate.isPending ? '建立中...' : '創建卡片'}
        </Button>
      </div>
    </div>
  )
}
